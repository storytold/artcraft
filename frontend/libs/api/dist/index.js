var ur = Object.defineProperty;
var lr = (s, t, n) => t in s ? ur(s, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : s[t] = n;
var Ve = (s, t, n) => lr(s, typeof t != "symbol" ? t + "" : t, n);
var fr = /* @__PURE__ */ ((s) => (s.AUDIO = "audio", s.IMAGE = "image", s.VIDEO = "video", s.DIMENSIONAL = "dimensional", s))(fr || {}), dr = /* @__PURE__ */ ((s) => (s.SCENE_JSON = "scene_json", s.GLB = "glb", s.GLTF = "gltf", s.PMX = "pmx", s.PMD = "pmd", s.VMD = "vmd", s))(dr || {}), pr = /* @__PURE__ */ ((s) => (s.ANIMATION = "animation", s.AUDIO = "audio", s.CHARACTER = "character", s.CREATURE = "creature", s.EXPRESSION = "expression", s.IMAGE_PLANE = "image_plane", s.LOCATION = "location", s.OBJECT = "object", s.SCENE = "scene", s.SET_DRESSING = "set_dressing", s.SKYBOX = "skybox", s.VIDEO_PLANE = "video_plane", s))(pr || {});
const hr = "https://api.storyteller.ai";
window.STORYTELLER_API_HOST_STORE = void 0;
class ut {
  constructor(t) {
    // NB(bt,2025-09-25): 'nx' is creating multiple copies of the library with name 
    //   mangling, so the singleton pattern fails to resolve to a single instance.
    // private static instance: StorytellerApiHostStore;
    /**
     * The scheme and host of the API.
     * This can optionally include a port, but no path components (including `/`).
     * eg. http://localhost:12345 or https://api.storyteller.ai
     */
    Ve(this, "apiSchemeAndHost");
    this.apiSchemeAndHost = t;
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
    const t = new ut(hr);
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
    const n = "https://".lastIndexOf("/");
    if (t.lastIndexOf("/") > n)
      throw new Error(`Path components should not be included in URL: ${t}`);
    this.apiSchemeAndHost = t;
  }
}
var ke = /* @__PURE__ */ ((s) => (s.GOOGLE_API = "https://storage.googleapis.com", s.FUNNEL_API = "https://style.storyteller.ai", s.CDN_API = "https://cdn.storyteller.ai", s.GRAVATAR_API = "https://www.gravatar.com", s))(ke || {}), Ge = { exports: {} }, A = {};
/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var zt;
function _r() {
  if (zt) return A;
  zt = 1;
  var s = Symbol.for("react.element"), t = Symbol.for("react.portal"), n = Symbol.for("react.fragment"), o = Symbol.for("react.strict_mode"), a = Symbol.for("react.profiler"), l = Symbol.for("react.provider"), f = Symbol.for("react.context"), _ = Symbol.for("react.forward_ref"), h = Symbol.for("react.suspense"), b = Symbol.for("react.memo"), R = Symbol.for("react.lazy"), C = Symbol.iterator;
  function W(i) {
    return i === null || typeof i != "object" ? null : (i = C && i[C] || i["@@iterator"], typeof i == "function" ? i : null);
  }
  var P = { isMounted: function() {
    return !1;
  }, enqueueForceUpdate: function() {
  }, enqueueReplaceState: function() {
  }, enqueueSetState: function() {
  } }, F = Object.assign, X = {};
  function z(i, d, w) {
    this.props = i, this.context = d, this.refs = X, this.updater = w || P;
  }
  z.prototype.isReactComponent = {}, z.prototype.setState = function(i, d) {
    if (typeof i != "object" && typeof i != "function" && i != null) throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
    this.updater.enqueueSetState(this, i, d, "setState");
  }, z.prototype.forceUpdate = function(i) {
    this.updater.enqueueForceUpdate(this, i, "forceUpdate");
  };
  function ne() {
  }
  ne.prototype = z.prototype;
  function se(i, d, w) {
    this.props = i, this.context = d, this.refs = X, this.updater = w || P;
  }
  var oe = se.prototype = new ne();
  oe.constructor = se, F(oe, z.prototype), oe.isPureReactComponent = !0;
  var J = Array.isArray, O = Object.prototype.hasOwnProperty, H = { current: null }, Q = { key: !0, ref: !0, __self: !0, __source: !0 };
  function q(i, d, w) {
    var E, k = {}, N = null, M = null;
    if (d != null) for (E in d.ref !== void 0 && (M = d.ref), d.key !== void 0 && (N = "" + d.key), d) O.call(d, E) && !Q.hasOwnProperty(E) && (k[E] = d[E]);
    var L = arguments.length - 2;
    if (L === 1) k.children = w;
    else if (1 < L) {
      for (var I = Array(L), Y = 0; Y < L; Y++) I[Y] = arguments[Y + 2];
      k.children = I;
    }
    if (i && i.defaultProps) for (E in L = i.defaultProps, L) k[E] === void 0 && (k[E] = L[E]);
    return { $$typeof: s, type: i, key: N, ref: M, props: k, _owner: H.current };
  }
  function de(i, d) {
    return { $$typeof: s, type: i.type, key: d, ref: i.ref, props: i.props, _owner: i._owner };
  }
  function ce(i) {
    return typeof i == "object" && i !== null && i.$$typeof === s;
  }
  function Je(i) {
    var d = { "=": "=0", ":": "=2" };
    return "$" + i.replace(/[=:]/g, function(w) {
      return d[w];
    });
  }
  var Ce = /\/+/g;
  function be(i, d) {
    return typeof i == "object" && i !== null && i.key != null ? Je("" + i.key) : d.toString(36);
  }
  function pe(i, d, w, E, k) {
    var N = typeof i;
    (N === "undefined" || N === "boolean") && (i = null);
    var M = !1;
    if (i === null) M = !0;
    else switch (N) {
      case "string":
      case "number":
        M = !0;
        break;
      case "object":
        switch (i.$$typeof) {
          case s:
          case t:
            M = !0;
        }
    }
    if (M) return M = i, k = k(M), i = E === "" ? "." + be(M, 0) : E, J(k) ? (w = "", i != null && (w = i.replace(Ce, "$&/") + "/"), pe(k, d, w, "", function(Y) {
      return Y;
    })) : k != null && (ce(k) && (k = de(k, w + (!k.key || M && M.key === k.key ? "" : ("" + k.key).replace(Ce, "$&/") + "/") + i)), d.push(k)), 1;
    if (M = 0, E = E === "" ? "." : E + ":", J(i)) for (var L = 0; L < i.length; L++) {
      N = i[L];
      var I = E + be(N, L);
      M += pe(N, d, w, I, k);
    }
    else if (I = W(i), typeof I == "function") for (i = I.call(i), L = 0; !(N = i.next()).done; ) N = N.value, I = E + be(N, L++), M += pe(N, d, w, I, k);
    else if (N === "object") throw d = String(i), Error("Objects are not valid as a React child (found: " + (d === "[object Object]" ? "object with keys {" + Object.keys(i).join(", ") + "}" : d) + "). If you meant to render a collection of children, use an array instead.");
    return M;
  }
  function te(i, d, w) {
    if (i == null) return i;
    var E = [], k = 0;
    return pe(i, E, "", "", function(N) {
      return d.call(w, N, k++);
    }), E;
  }
  function ae(i) {
    if (i._status === -1) {
      var d = i._result;
      d = d(), d.then(function(w) {
        (i._status === 0 || i._status === -1) && (i._status = 1, i._result = w);
      }, function(w) {
        (i._status === 0 || i._status === -1) && (i._status = 2, i._result = w);
      }), i._status === -1 && (i._status = 0, i._result = d);
    }
    if (i._status === 1) return i._result.default;
    throw i._result;
  }
  var v = { current: null }, ue = { transition: null }, Ie = { ReactCurrentDispatcher: v, ReactCurrentBatchConfig: ue, ReactCurrentOwner: H };
  function he() {
    throw Error("act(...) is not supported in production builds of React.");
  }
  return A.Children = { map: te, forEach: function(i, d, w) {
    te(i, function() {
      d.apply(this, arguments);
    }, w);
  }, count: function(i) {
    var d = 0;
    return te(i, function() {
      d++;
    }), d;
  }, toArray: function(i) {
    return te(i, function(d) {
      return d;
    }) || [];
  }, only: function(i) {
    if (!ce(i)) throw Error("React.Children.only expected to receive a single React element child.");
    return i;
  } }, A.Component = z, A.Fragment = n, A.Profiler = a, A.PureComponent = se, A.StrictMode = o, A.Suspense = h, A.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = Ie, A.act = he, A.cloneElement = function(i, d, w) {
    if (i == null) throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + i + ".");
    var E = F({}, i.props), k = i.key, N = i.ref, M = i._owner;
    if (d != null) {
      if (d.ref !== void 0 && (N = d.ref, M = H.current), d.key !== void 0 && (k = "" + d.key), i.type && i.type.defaultProps) var L = i.type.defaultProps;
      for (I in d) O.call(d, I) && !Q.hasOwnProperty(I) && (E[I] = d[I] === void 0 && L !== void 0 ? L[I] : d[I]);
    }
    var I = arguments.length - 2;
    if (I === 1) E.children = w;
    else if (1 < I) {
      L = Array(I);
      for (var Y = 0; Y < I; Y++) L[Y] = arguments[Y + 2];
      E.children = L;
    }
    return { $$typeof: s, type: i.type, key: k, ref: N, props: E, _owner: M };
  }, A.createContext = function(i) {
    return i = { $$typeof: f, _currentValue: i, _currentValue2: i, _threadCount: 0, Provider: null, Consumer: null, _defaultValue: null, _globalName: null }, i.Provider = { $$typeof: l, _context: i }, i.Consumer = i;
  }, A.createElement = q, A.createFactory = function(i) {
    var d = q.bind(null, i);
    return d.type = i, d;
  }, A.createRef = function() {
    return { current: null };
  }, A.forwardRef = function(i) {
    return { $$typeof: _, render: i };
  }, A.isValidElement = ce, A.lazy = function(i) {
    return { $$typeof: R, _payload: { _status: -1, _result: i }, _init: ae };
  }, A.memo = function(i, d) {
    return { $$typeof: b, type: i, compare: d === void 0 ? null : d };
  }, A.startTransition = function(i) {
    var d = ue.transition;
    ue.transition = {};
    try {
      i();
    } finally {
      ue.transition = d;
    }
  }, A.unstable_act = he, A.useCallback = function(i, d) {
    return v.current.useCallback(i, d);
  }, A.useContext = function(i) {
    return v.current.useContext(i);
  }, A.useDebugValue = function() {
  }, A.useDeferredValue = function(i) {
    return v.current.useDeferredValue(i);
  }, A.useEffect = function(i, d) {
    return v.current.useEffect(i, d);
  }, A.useId = function() {
    return v.current.useId();
  }, A.useImperativeHandle = function(i, d, w) {
    return v.current.useImperativeHandle(i, d, w);
  }, A.useInsertionEffect = function(i, d) {
    return v.current.useInsertionEffect(i, d);
  }, A.useLayoutEffect = function(i, d) {
    return v.current.useLayoutEffect(i, d);
  }, A.useMemo = function(i, d) {
    return v.current.useMemo(i, d);
  }, A.useReducer = function(i, d, w) {
    return v.current.useReducer(i, d, w);
  }, A.useRef = function(i) {
    return v.current.useRef(i);
  }, A.useState = function(i) {
    return v.current.useState(i);
  }, A.useSyncExternalStore = function(i, d, w) {
    return v.current.useSyncExternalStore(i, d, w);
  }, A.useTransition = function() {
    return v.current.useTransition();
  }, A.version = "18.3.1", A;
}
var Oe = { exports: {} };
/**
 * @license React
 * react.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Oe.exports;
var Jt;
function mr() {
  return Jt || (Jt = 1, function(s, t) {
    process.env.NODE_ENV !== "production" && function() {
      typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart == "function" && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(new Error());
      var n = "18.3.1", o = Symbol.for("react.element"), a = Symbol.for("react.portal"), l = Symbol.for("react.fragment"), f = Symbol.for("react.strict_mode"), _ = Symbol.for("react.profiler"), h = Symbol.for("react.provider"), b = Symbol.for("react.context"), R = Symbol.for("react.forward_ref"), C = Symbol.for("react.suspense"), W = Symbol.for("react.suspense_list"), P = Symbol.for("react.memo"), F = Symbol.for("react.lazy"), X = Symbol.for("react.offscreen"), z = Symbol.iterator, ne = "@@iterator";
      function se(e) {
        if (e === null || typeof e != "object")
          return null;
        var r = z && e[z] || e[ne];
        return typeof r == "function" ? r : null;
      }
      var oe = {
        /**
         * @internal
         * @type {ReactComponent}
         */
        current: null
      }, J = {
        transition: null
      }, O = {
        current: null,
        // Used to reproduce behavior of `batchedUpdates` in legacy mode.
        isBatchingLegacy: !1,
        didScheduleLegacyUpdate: !1
      }, H = {
        /**
         * @internal
         * @type {ReactComponent}
         */
        current: null
      }, Q = {}, q = null;
      function de(e) {
        q = e;
      }
      Q.setExtraStackFrame = function(e) {
        q = e;
      }, Q.getCurrentStack = null, Q.getStackAddendum = function() {
        var e = "";
        q && (e += q);
        var r = Q.getCurrentStack;
        return r && (e += r() || ""), e;
      };
      var ce = !1, Je = !1, Ce = !1, be = !1, pe = !1, te = {
        ReactCurrentDispatcher: oe,
        ReactCurrentBatchConfig: J,
        ReactCurrentOwner: H
      };
      te.ReactDebugCurrentFrame = Q, te.ReactCurrentActQueue = O;
      function ae(e) {
        {
          for (var r = arguments.length, c = new Array(r > 1 ? r - 1 : 0), u = 1; u < r; u++)
            c[u - 1] = arguments[u];
          ue("warn", e, c);
        }
      }
      function v(e) {
        {
          for (var r = arguments.length, c = new Array(r > 1 ? r - 1 : 0), u = 1; u < r; u++)
            c[u - 1] = arguments[u];
          ue("error", e, c);
        }
      }
      function ue(e, r, c) {
        {
          var u = te.ReactDebugCurrentFrame, p = u.getStackAddendum();
          p !== "" && (r += "%s", c = c.concat([p]));
          var g = c.map(function(m) {
            return String(m);
          });
          g.unshift("Warning: " + r), Function.prototype.apply.call(console[e], console, g);
        }
      }
      var Ie = {};
      function he(e, r) {
        {
          var c = e.constructor, u = c && (c.displayName || c.name) || "ReactClass", p = u + "." + r;
          if (Ie[p])
            return;
          v("Can't call %s on a component that is not yet mounted. This is a no-op, but it might indicate a bug in your application. Instead, assign to `this.state` directly or define a `state = {};` class property with the desired state in the %s component.", r, u), Ie[p] = !0;
        }
      }
      var i = {
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
        enqueueForceUpdate: function(e, r, c) {
          he(e, "forceUpdate");
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
        enqueueReplaceState: function(e, r, c, u) {
          he(e, "replaceState");
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
        enqueueSetState: function(e, r, c, u) {
          he(e, "setState");
        }
      }, d = Object.assign, w = {};
      Object.freeze(w);
      function E(e, r, c) {
        this.props = e, this.context = r, this.refs = w, this.updater = c || i;
      }
      E.prototype.isReactComponent = {}, E.prototype.setState = function(e, r) {
        if (typeof e != "object" && typeof e != "function" && e != null)
          throw new Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
        this.updater.enqueueSetState(this, e, r, "setState");
      }, E.prototype.forceUpdate = function(e) {
        this.updater.enqueueForceUpdate(this, e, "forceUpdate");
      };
      {
        var k = {
          isMounted: ["isMounted", "Instead, make sure to clean up subscriptions and pending requests in componentWillUnmount to prevent memory leaks."],
          replaceState: ["replaceState", "Refactor your code to use setState instead (see https://github.com/facebook/react/issues/3236)."]
        }, N = function(e, r) {
          Object.defineProperty(E.prototype, e, {
            get: function() {
              ae("%s(...) is deprecated in plain JavaScript React classes. %s", r[0], r[1]);
            }
          });
        };
        for (var M in k)
          k.hasOwnProperty(M) && N(M, k[M]);
      }
      function L() {
      }
      L.prototype = E.prototype;
      function I(e, r, c) {
        this.props = e, this.context = r, this.refs = w, this.updater = c || i;
      }
      var Y = I.prototype = new L();
      Y.constructor = I, d(Y, E.prototype), Y.isPureReactComponent = !0;
      function nn() {
        var e = {
          current: null
        };
        return Object.seal(e), e;
      }
      var rn = Array.isArray;
      function Pe(e) {
        return rn(e);
      }
      function sn(e) {
        {
          var r = typeof Symbol == "function" && Symbol.toStringTag, c = r && e[Symbol.toStringTag] || e.constructor.name || "Object";
          return c;
        }
      }
      function on(e) {
        try {
          return lt(e), !1;
        } catch {
          return !0;
        }
      }
      function lt(e) {
        return "" + e;
      }
      function $e(e) {
        if (on(e))
          return v("The provided key is an unsupported type %s. This value must be coerced to a string before before using it here.", sn(e)), lt(e);
      }
      function an(e, r, c) {
        var u = e.displayName;
        if (u)
          return u;
        var p = r.displayName || r.name || "";
        return p !== "" ? c + "(" + p + ")" : c;
      }
      function ft(e) {
        return e.displayName || "Context";
      }
      function ie(e) {
        if (e == null)
          return null;
        if (typeof e.tag == "number" && v("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."), typeof e == "function")
          return e.displayName || e.name || null;
        if (typeof e == "string")
          return e;
        switch (e) {
          case l:
            return "Fragment";
          case a:
            return "Portal";
          case _:
            return "Profiler";
          case f:
            return "StrictMode";
          case C:
            return "Suspense";
          case W:
            return "SuspenseList";
        }
        if (typeof e == "object")
          switch (e.$$typeof) {
            case b:
              var r = e;
              return ft(r) + ".Consumer";
            case h:
              var c = e;
              return ft(c._context) + ".Provider";
            case R:
              return an(e, e.render, "ForwardRef");
            case P:
              var u = e.displayName || null;
              return u !== null ? u : ie(e.type) || "Memo";
            case F: {
              var p = e, g = p._payload, m = p._init;
              try {
                return ie(m(g));
              } catch {
                return null;
              }
            }
          }
        return null;
      }
      var Ae = Object.prototype.hasOwnProperty, dt = {
        key: !0,
        ref: !0,
        __self: !0,
        __source: !0
      }, pt, ht, Ke;
      Ke = {};
      function _t(e) {
        if (Ae.call(e, "ref")) {
          var r = Object.getOwnPropertyDescriptor(e, "ref").get;
          if (r && r.isReactWarning)
            return !1;
        }
        return e.ref !== void 0;
      }
      function mt(e) {
        if (Ae.call(e, "key")) {
          var r = Object.getOwnPropertyDescriptor(e, "key").get;
          if (r && r.isReactWarning)
            return !1;
        }
        return e.key !== void 0;
      }
      function cn(e, r) {
        var c = function() {
          pt || (pt = !0, v("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", r));
        };
        c.isReactWarning = !0, Object.defineProperty(e, "key", {
          get: c,
          configurable: !0
        });
      }
      function un(e, r) {
        var c = function() {
          ht || (ht = !0, v("%s: `ref` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", r));
        };
        c.isReactWarning = !0, Object.defineProperty(e, "ref", {
          get: c,
          configurable: !0
        });
      }
      function ln(e) {
        if (typeof e.ref == "string" && H.current && e.__self && H.current.stateNode !== e.__self) {
          var r = ie(H.current.type);
          Ke[r] || (v('Component "%s" contains the string ref "%s". Support for string refs will be removed in a future major release. This case cannot be automatically converted to an arrow function. We ask you to manually fix this case by using useRef() or createRef() instead. Learn more about using refs safely here: https://reactjs.org/link/strict-mode-string-ref', r, e.ref), Ke[r] = !0);
        }
      }
      var Xe = function(e, r, c, u, p, g, m) {
        var y = {
          // This tag allows us to uniquely identify this as a React Element
          $$typeof: o,
          // Built-in properties that belong on the element
          type: e,
          key: r,
          ref: c,
          props: m,
          // Record the component responsible for creating this element.
          _owner: g
        };
        return y._store = {}, Object.defineProperty(y._store, "validated", {
          configurable: !1,
          enumerable: !1,
          writable: !0,
          value: !1
        }), Object.defineProperty(y, "_self", {
          configurable: !1,
          enumerable: !1,
          writable: !1,
          value: u
        }), Object.defineProperty(y, "_source", {
          configurable: !1,
          enumerable: !1,
          writable: !1,
          value: p
        }), Object.freeze && (Object.freeze(y.props), Object.freeze(y)), y;
      };
      function fn(e, r, c) {
        var u, p = {}, g = null, m = null, y = null, S = null;
        if (r != null) {
          _t(r) && (m = r.ref, ln(r)), mt(r) && ($e(r.key), g = "" + r.key), y = r.__self === void 0 ? null : r.__self, S = r.__source === void 0 ? null : r.__source;
          for (u in r)
            Ae.call(r, u) && !dt.hasOwnProperty(u) && (p[u] = r[u]);
        }
        var T = arguments.length - 2;
        if (T === 1)
          p.children = c;
        else if (T > 1) {
          for (var $ = Array(T), j = 0; j < T; j++)
            $[j] = arguments[j + 2];
          Object.freeze && Object.freeze($), p.children = $;
        }
        if (e && e.defaultProps) {
          var U = e.defaultProps;
          for (u in U)
            p[u] === void 0 && (p[u] = U[u]);
        }
        if (g || m) {
          var x = typeof e == "function" ? e.displayName || e.name || "Unknown" : e;
          g && cn(p, x), m && un(p, x);
        }
        return Xe(e, g, m, y, S, H.current, p);
      }
      function dn(e, r) {
        var c = Xe(e.type, r, e.ref, e._self, e._source, e._owner, e.props);
        return c;
      }
      function pn(e, r, c) {
        if (e == null)
          throw new Error("React.cloneElement(...): The argument must be a React element, but you passed " + e + ".");
        var u, p = d({}, e.props), g = e.key, m = e.ref, y = e._self, S = e._source, T = e._owner;
        if (r != null) {
          _t(r) && (m = r.ref, T = H.current), mt(r) && ($e(r.key), g = "" + r.key);
          var $;
          e.type && e.type.defaultProps && ($ = e.type.defaultProps);
          for (u in r)
            Ae.call(r, u) && !dt.hasOwnProperty(u) && (r[u] === void 0 && $ !== void 0 ? p[u] = $[u] : p[u] = r[u]);
        }
        var j = arguments.length - 2;
        if (j === 1)
          p.children = c;
        else if (j > 1) {
          for (var U = Array(j), x = 0; x < j; x++)
            U[x] = arguments[x + 2];
          p.children = U;
        }
        return Xe(e.type, g, m, y, S, T, p);
      }
      function _e(e) {
        return typeof e == "object" && e !== null && e.$$typeof === o;
      }
      var gt = ".", hn = ":";
      function _n(e) {
        var r = /[=:]/g, c = {
          "=": "=0",
          ":": "=2"
        }, u = e.replace(r, function(p) {
          return c[p];
        });
        return "$" + u;
      }
      var vt = !1, mn = /\/+/g;
      function yt(e) {
        return e.replace(mn, "$&/");
      }
      function Qe(e, r) {
        return typeof e == "object" && e !== null && e.key != null ? ($e(e.key), _n("" + e.key)) : r.toString(36);
      }
      function je(e, r, c, u, p) {
        var g = typeof e;
        (g === "undefined" || g === "boolean") && (e = null);
        var m = !1;
        if (e === null)
          m = !0;
        else
          switch (g) {
            case "string":
            case "number":
              m = !0;
              break;
            case "object":
              switch (e.$$typeof) {
                case o:
                case a:
                  m = !0;
              }
          }
        if (m) {
          var y = e, S = p(y), T = u === "" ? gt + Qe(y, 0) : u;
          if (Pe(S)) {
            var $ = "";
            T != null && ($ = yt(T) + "/"), je(S, r, $, "", function(cr) {
              return cr;
            });
          } else S != null && (_e(S) && (S.key && (!y || y.key !== S.key) && $e(S.key), S = dn(
            S,
            // Keep both the (mapped) and old keys if they differ, just as
            // traverseAllChildren used to do for objects as children
            c + // $FlowFixMe Flow incorrectly thinks React.Portal doesn't have a key
            (S.key && (!y || y.key !== S.key) ? (
              // $FlowFixMe Flow incorrectly thinks existing element's key can be a number
              // eslint-disable-next-line react-internal/safe-string-coercion
              yt("" + S.key) + "/"
            ) : "") + T
          )), r.push(S));
          return 1;
        }
        var j, U, x = 0, D = u === "" ? gt : u + hn;
        if (Pe(e))
          for (var De = 0; De < e.length; De++)
            j = e[De], U = D + Qe(j, De), x += je(j, r, c, U, p);
        else {
          var at = se(e);
          if (typeof at == "function") {
            var Wt = e;
            at === Wt.entries && (vt || ae("Using Maps as children is not supported. Use an array of keyed ReactElements instead."), vt = !0);
            for (var ar = at.call(Wt), Yt, ir = 0; !(Yt = ar.next()).done; )
              j = Yt.value, U = D + Qe(j, ir++), x += je(j, r, c, U, p);
          } else if (g === "object") {
            var Bt = String(e);
            throw new Error("Objects are not valid as a React child (found: " + (Bt === "[object Object]" ? "object with keys {" + Object.keys(e).join(", ") + "}" : Bt) + "). If you meant to render a collection of children, use an array instead.");
          }
        }
        return x;
      }
      function Me(e, r, c) {
        if (e == null)
          return e;
        var u = [], p = 0;
        return je(e, u, "", "", function(g) {
          return r.call(c, g, p++);
        }), u;
      }
      function gn(e) {
        var r = 0;
        return Me(e, function() {
          r++;
        }), r;
      }
      function vn(e, r, c) {
        Me(e, function() {
          r.apply(this, arguments);
        }, c);
      }
      function yn(e) {
        return Me(e, function(r) {
          return r;
        }) || [];
      }
      function bn(e) {
        if (!_e(e))
          throw new Error("React.Children.only expected to receive a single React element child.");
        return e;
      }
      function An(e) {
        var r = {
          $$typeof: b,
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
        r.Provider = {
          $$typeof: h,
          _context: r
        };
        var c = !1, u = !1, p = !1;
        {
          var g = {
            $$typeof: b,
            _context: r
          };
          Object.defineProperties(g, {
            Provider: {
              get: function() {
                return u || (u = !0, v("Rendering <Context.Consumer.Provider> is not supported and will be removed in a future major release. Did you mean to render <Context.Provider> instead?")), r.Provider;
              },
              set: function(m) {
                r.Provider = m;
              }
            },
            _currentValue: {
              get: function() {
                return r._currentValue;
              },
              set: function(m) {
                r._currentValue = m;
              }
            },
            _currentValue2: {
              get: function() {
                return r._currentValue2;
              },
              set: function(m) {
                r._currentValue2 = m;
              }
            },
            _threadCount: {
              get: function() {
                return r._threadCount;
              },
              set: function(m) {
                r._threadCount = m;
              }
            },
            Consumer: {
              get: function() {
                return c || (c = !0, v("Rendering <Context.Consumer.Consumer> is not supported and will be removed in a future major release. Did you mean to render <Context.Consumer> instead?")), r.Consumer;
              }
            },
            displayName: {
              get: function() {
                return r.displayName;
              },
              set: function(m) {
                p || (ae("Setting `displayName` on Context.Consumer has no effect. You should set it directly on the context with Context.displayName = '%s'.", m), p = !0);
              }
            }
          }), r.Consumer = g;
        }
        return r._currentRenderer = null, r._currentRenderer2 = null, r;
      }
      var we = -1, qe = 0, bt = 1, wn = 2;
      function Sn(e) {
        if (e._status === we) {
          var r = e._result, c = r();
          if (c.then(function(g) {
            if (e._status === qe || e._status === we) {
              var m = e;
              m._status = bt, m._result = g;
            }
          }, function(g) {
            if (e._status === qe || e._status === we) {
              var m = e;
              m._status = wn, m._result = g;
            }
          }), e._status === we) {
            var u = e;
            u._status = qe, u._result = c;
          }
        }
        if (e._status === bt) {
          var p = e._result;
          return p === void 0 && v(`lazy: Expected the result of a dynamic import() call. Instead received: %s

Your code should look like: 
  const MyComponent = lazy(() => import('./MyComponent'))

Did you accidentally put curly braces around the import?`, p), "default" in p || v(`lazy: Expected the result of a dynamic import() call. Instead received: %s

Your code should look like: 
  const MyComponent = lazy(() => import('./MyComponent'))`, p), p.default;
        } else
          throw e._result;
      }
      function En(e) {
        var r = {
          // We use these fields to store the result.
          _status: we,
          _result: e
        }, c = {
          $$typeof: F,
          _payload: r,
          _init: Sn
        };
        {
          var u, p;
          Object.defineProperties(c, {
            defaultProps: {
              configurable: !0,
              get: function() {
                return u;
              },
              set: function(g) {
                v("React.lazy(...): It is not supported to assign `defaultProps` to a lazy component import. Either specify them where the component is defined, or create a wrapping component around it."), u = g, Object.defineProperty(c, "defaultProps", {
                  enumerable: !0
                });
              }
            },
            propTypes: {
              configurable: !0,
              get: function() {
                return p;
              },
              set: function(g) {
                v("React.lazy(...): It is not supported to assign `propTypes` to a lazy component import. Either specify them where the component is defined, or create a wrapping component around it."), p = g, Object.defineProperty(c, "propTypes", {
                  enumerable: !0
                });
              }
            }
          });
        }
        return c;
      }
      function Rn(e) {
        e != null && e.$$typeof === P ? v("forwardRef requires a render function but received a `memo` component. Instead of forwardRef(memo(...)), use memo(forwardRef(...)).") : typeof e != "function" ? v("forwardRef requires a render function but was given %s.", e === null ? "null" : typeof e) : e.length !== 0 && e.length !== 2 && v("forwardRef render functions accept exactly two parameters: props and ref. %s", e.length === 1 ? "Did you forget to use the ref parameter?" : "Any additional parameter will be undefined."), e != null && (e.defaultProps != null || e.propTypes != null) && v("forwardRef render functions do not support propTypes or defaultProps. Did you accidentally pass a React component?");
        var r = {
          $$typeof: R,
          render: e
        };
        {
          var c;
          Object.defineProperty(r, "displayName", {
            enumerable: !1,
            configurable: !0,
            get: function() {
              return c;
            },
            set: function(u) {
              c = u, !e.name && !e.displayName && (e.displayName = u);
            }
          });
        }
        return r;
      }
      var At;
      At = Symbol.for("react.module.reference");
      function wt(e) {
        return !!(typeof e == "string" || typeof e == "function" || e === l || e === _ || pe || e === f || e === C || e === W || be || e === X || ce || Je || Ce || typeof e == "object" && e !== null && (e.$$typeof === F || e.$$typeof === P || e.$$typeof === h || e.$$typeof === b || e.$$typeof === R || // This needs to include all possible module reference object
        // types supported by any Flight configuration anywhere since
        // we don't know which Flight build this will end up being used
        // with.
        e.$$typeof === At || e.getModuleId !== void 0));
      }
      function kn(e, r) {
        wt(e) || v("memo: The first argument must be a component. Instead received: %s", e === null ? "null" : typeof e);
        var c = {
          $$typeof: P,
          type: e,
          compare: r === void 0 ? null : r
        };
        {
          var u;
          Object.defineProperty(c, "displayName", {
            enumerable: !1,
            configurable: !0,
            get: function() {
              return u;
            },
            set: function(p) {
              u = p, !e.name && !e.displayName && (e.displayName = p);
            }
          });
        }
        return c;
      }
      function B() {
        var e = oe.current;
        return e === null && v(`Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:
1. You might have mismatching versions of React and the renderer (such as React DOM)
2. You might be breaking the Rules of Hooks
3. You might have more than one copy of React in the same app
See https://reactjs.org/link/invalid-hook-call for tips about how to debug and fix this problem.`), e;
      }
      function On(e) {
        var r = B();
        if (e._context !== void 0) {
          var c = e._context;
          c.Consumer === e ? v("Calling useContext(Context.Consumer) is not supported, may cause bugs, and will be removed in a future major release. Did you mean to call useContext(Context) instead?") : c.Provider === e && v("Calling useContext(Context.Provider) is not supported. Did you mean to call useContext(Context) instead?");
        }
        return r.useContext(e);
      }
      function Tn(e) {
        var r = B();
        return r.useState(e);
      }
      function Cn(e, r, c) {
        var u = B();
        return u.useReducer(e, r, c);
      }
      function In(e) {
        var r = B();
        return r.useRef(e);
      }
      function Pn(e, r) {
        var c = B();
        return c.useEffect(e, r);
      }
      function $n(e, r) {
        var c = B();
        return c.useInsertionEffect(e, r);
      }
      function jn(e, r) {
        var c = B();
        return c.useLayoutEffect(e, r);
      }
      function Mn(e, r) {
        var c = B();
        return c.useCallback(e, r);
      }
      function Ln(e, r) {
        var c = B();
        return c.useMemo(e, r);
      }
      function Un(e, r, c) {
        var u = B();
        return u.useImperativeHandle(e, r, c);
      }
      function Hn(e, r) {
        {
          var c = B();
          return c.useDebugValue(e, r);
        }
      }
      function Nn() {
        var e = B();
        return e.useTransition();
      }
      function xn(e) {
        var r = B();
        return r.useDeferredValue(e);
      }
      function Fn() {
        var e = B();
        return e.useId();
      }
      function Dn(e, r, c) {
        var u = B();
        return u.useSyncExternalStore(e, r, c);
      }
      var Se = 0, St, Et, Rt, kt, Ot, Tt, Ct;
      function It() {
      }
      It.__reactDisabledLog = !0;
      function Vn() {
        {
          if (Se === 0) {
            St = console.log, Et = console.info, Rt = console.warn, kt = console.error, Ot = console.group, Tt = console.groupCollapsed, Ct = console.groupEnd;
            var e = {
              configurable: !0,
              enumerable: !0,
              value: It,
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
          Se++;
        }
      }
      function Gn() {
        {
          if (Se--, Se === 0) {
            var e = {
              configurable: !0,
              enumerable: !0,
              writable: !0
            };
            Object.defineProperties(console, {
              log: d({}, e, {
                value: St
              }),
              info: d({}, e, {
                value: Et
              }),
              warn: d({}, e, {
                value: Rt
              }),
              error: d({}, e, {
                value: kt
              }),
              group: d({}, e, {
                value: Ot
              }),
              groupCollapsed: d({}, e, {
                value: Tt
              }),
              groupEnd: d({}, e, {
                value: Ct
              })
            });
          }
          Se < 0 && v("disabledDepth fell below zero. This is a bug in React. Please file an issue.");
        }
      }
      var Ze = te.ReactCurrentDispatcher, et;
      function Le(e, r, c) {
        {
          if (et === void 0)
            try {
              throw Error();
            } catch (p) {
              var u = p.stack.trim().match(/\n( *(at )?)/);
              et = u && u[1] || "";
            }
          return `
` + et + e;
        }
      }
      var tt = !1, Ue;
      {
        var Wn = typeof WeakMap == "function" ? WeakMap : Map;
        Ue = new Wn();
      }
      function Pt(e, r) {
        if (!e || tt)
          return "";
        {
          var c = Ue.get(e);
          if (c !== void 0)
            return c;
        }
        var u;
        tt = !0;
        var p = Error.prepareStackTrace;
        Error.prepareStackTrace = void 0;
        var g;
        g = Ze.current, Ze.current = null, Vn();
        try {
          if (r) {
            var m = function() {
              throw Error();
            };
            if (Object.defineProperty(m.prototype, "props", {
              set: function() {
                throw Error();
              }
            }), typeof Reflect == "object" && Reflect.construct) {
              try {
                Reflect.construct(m, []);
              } catch (D) {
                u = D;
              }
              Reflect.construct(e, [], m);
            } else {
              try {
                m.call();
              } catch (D) {
                u = D;
              }
              e.call(m.prototype);
            }
          } else {
            try {
              throw Error();
            } catch (D) {
              u = D;
            }
            e();
          }
        } catch (D) {
          if (D && u && typeof D.stack == "string") {
            for (var y = D.stack.split(`
`), S = u.stack.split(`
`), T = y.length - 1, $ = S.length - 1; T >= 1 && $ >= 0 && y[T] !== S[$]; )
              $--;
            for (; T >= 1 && $ >= 0; T--, $--)
              if (y[T] !== S[$]) {
                if (T !== 1 || $ !== 1)
                  do
                    if (T--, $--, $ < 0 || y[T] !== S[$]) {
                      var j = `
` + y[T].replace(" at new ", " at ");
                      return e.displayName && j.includes("<anonymous>") && (j = j.replace("<anonymous>", e.displayName)), typeof e == "function" && Ue.set(e, j), j;
                    }
                  while (T >= 1 && $ >= 0);
                break;
              }
          }
        } finally {
          tt = !1, Ze.current = g, Gn(), Error.prepareStackTrace = p;
        }
        var U = e ? e.displayName || e.name : "", x = U ? Le(U) : "";
        return typeof e == "function" && Ue.set(e, x), x;
      }
      function Yn(e, r, c) {
        return Pt(e, !1);
      }
      function Bn(e) {
        var r = e.prototype;
        return !!(r && r.isReactComponent);
      }
      function He(e, r, c) {
        if (e == null)
          return "";
        if (typeof e == "function")
          return Pt(e, Bn(e));
        if (typeof e == "string")
          return Le(e);
        switch (e) {
          case C:
            return Le("Suspense");
          case W:
            return Le("SuspenseList");
        }
        if (typeof e == "object")
          switch (e.$$typeof) {
            case R:
              return Yn(e.render);
            case P:
              return He(e.type, r, c);
            case F: {
              var u = e, p = u._payload, g = u._init;
              try {
                return He(g(p), r, c);
              } catch {
              }
            }
          }
        return "";
      }
      var $t = {}, jt = te.ReactDebugCurrentFrame;
      function Ne(e) {
        if (e) {
          var r = e._owner, c = He(e.type, e._source, r ? r.type : null);
          jt.setExtraStackFrame(c);
        } else
          jt.setExtraStackFrame(null);
      }
      function zn(e, r, c, u, p) {
        {
          var g = Function.call.bind(Ae);
          for (var m in e)
            if (g(e, m)) {
              var y = void 0;
              try {
                if (typeof e[m] != "function") {
                  var S = Error((u || "React class") + ": " + c + " type `" + m + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof e[m] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.");
                  throw S.name = "Invariant Violation", S;
                }
                y = e[m](r, m, u, c, null, "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED");
              } catch (T) {
                y = T;
              }
              y && !(y instanceof Error) && (Ne(p), v("%s: type specification of %s `%s` is invalid; the type checker function must return `null` or an `Error` but returned a %s. You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument).", u || "React class", c, m, typeof y), Ne(null)), y instanceof Error && !(y.message in $t) && ($t[y.message] = !0, Ne(p), v("Failed %s type: %s", c, y.message), Ne(null));
            }
        }
      }
      function me(e) {
        if (e) {
          var r = e._owner, c = He(e.type, e._source, r ? r.type : null);
          de(c);
        } else
          de(null);
      }
      var nt;
      nt = !1;
      function Mt() {
        if (H.current) {
          var e = ie(H.current.type);
          if (e)
            return `

Check the render method of \`` + e + "`.";
        }
        return "";
      }
      function Jn(e) {
        if (e !== void 0) {
          var r = e.fileName.replace(/^.*[\\\/]/, ""), c = e.lineNumber;
          return `

Check your code at ` + r + ":" + c + ".";
        }
        return "";
      }
      function Kn(e) {
        return e != null ? Jn(e.__source) : "";
      }
      var Lt = {};
      function Xn(e) {
        var r = Mt();
        if (!r) {
          var c = typeof e == "string" ? e : e.displayName || e.name;
          c && (r = `

Check the top-level render call using <` + c + ">.");
        }
        return r;
      }
      function Ut(e, r) {
        if (!(!e._store || e._store.validated || e.key != null)) {
          e._store.validated = !0;
          var c = Xn(r);
          if (!Lt[c]) {
            Lt[c] = !0;
            var u = "";
            e && e._owner && e._owner !== H.current && (u = " It was passed a child from " + ie(e._owner.type) + "."), me(e), v('Each child in a list should have a unique "key" prop.%s%s See https://reactjs.org/link/warning-keys for more information.', c, u), me(null);
          }
        }
      }
      function Ht(e, r) {
        if (typeof e == "object") {
          if (Pe(e))
            for (var c = 0; c < e.length; c++) {
              var u = e[c];
              _e(u) && Ut(u, r);
            }
          else if (_e(e))
            e._store && (e._store.validated = !0);
          else if (e) {
            var p = se(e);
            if (typeof p == "function" && p !== e.entries)
              for (var g = p.call(e), m; !(m = g.next()).done; )
                _e(m.value) && Ut(m.value, r);
          }
        }
      }
      function Nt(e) {
        {
          var r = e.type;
          if (r == null || typeof r == "string")
            return;
          var c;
          if (typeof r == "function")
            c = r.propTypes;
          else if (typeof r == "object" && (r.$$typeof === R || // Note: Memo only checks outer props here.
          // Inner props are checked in the reconciler.
          r.$$typeof === P))
            c = r.propTypes;
          else
            return;
          if (c) {
            var u = ie(r);
            zn(c, e.props, "prop", u, e);
          } else if (r.PropTypes !== void 0 && !nt) {
            nt = !0;
            var p = ie(r);
            v("Component %s declared `PropTypes` instead of `propTypes`. Did you misspell the property assignment?", p || "Unknown");
          }
          typeof r.getDefaultProps == "function" && !r.getDefaultProps.isReactClassApproved && v("getDefaultProps is only used on classic React.createClass definitions. Use a static property named `defaultProps` instead.");
        }
      }
      function Qn(e) {
        {
          for (var r = Object.keys(e.props), c = 0; c < r.length; c++) {
            var u = r[c];
            if (u !== "children" && u !== "key") {
              me(e), v("Invalid prop `%s` supplied to `React.Fragment`. React.Fragment can only have `key` and `children` props.", u), me(null);
              break;
            }
          }
          e.ref !== null && (me(e), v("Invalid attribute `ref` supplied to `React.Fragment`."), me(null));
        }
      }
      function xt(e, r, c) {
        var u = wt(e);
        if (!u) {
          var p = "";
          (e === void 0 || typeof e == "object" && e !== null && Object.keys(e).length === 0) && (p += " You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.");
          var g = Kn(r);
          g ? p += g : p += Mt();
          var m;
          e === null ? m = "null" : Pe(e) ? m = "array" : e !== void 0 && e.$$typeof === o ? (m = "<" + (ie(e.type) || "Unknown") + " />", p = " Did you accidentally export a JSX literal instead of a component?") : m = typeof e, v("React.createElement: type is invalid -- expected a string (for built-in components) or a class/function (for composite components) but got: %s.%s", m, p);
        }
        var y = fn.apply(this, arguments);
        if (y == null)
          return y;
        if (u)
          for (var S = 2; S < arguments.length; S++)
            Ht(arguments[S], e);
        return e === l ? Qn(y) : Nt(y), y;
      }
      var Ft = !1;
      function qn(e) {
        var r = xt.bind(null, e);
        return r.type = e, Ft || (Ft = !0, ae("React.createFactory() is deprecated and will be removed in a future major release. Consider using JSX or use React.createElement() directly instead.")), Object.defineProperty(r, "type", {
          enumerable: !1,
          get: function() {
            return ae("Factory.type is deprecated. Access the class directly before passing it to createFactory."), Object.defineProperty(this, "type", {
              value: e
            }), e;
          }
        }), r;
      }
      function Zn(e, r, c) {
        for (var u = pn.apply(this, arguments), p = 2; p < arguments.length; p++)
          Ht(arguments[p], u.type);
        return Nt(u), u;
      }
      function er(e, r) {
        var c = J.transition;
        J.transition = {};
        var u = J.transition;
        J.transition._updatedFibers = /* @__PURE__ */ new Set();
        try {
          e();
        } finally {
          if (J.transition = c, c === null && u._updatedFibers) {
            var p = u._updatedFibers.size;
            p > 10 && ae("Detected a large number of updates inside startTransition. If this is due to a subscription please re-write it to use React provided hooks. Otherwise concurrent mode guarantees are off the table."), u._updatedFibers.clear();
          }
        }
      }
      var Dt = !1, xe = null;
      function tr(e) {
        if (xe === null)
          try {
            var r = ("require" + Math.random()).slice(0, 7), c = s && s[r];
            xe = c.call(s, "timers").setImmediate;
          } catch {
            xe = function(p) {
              Dt === !1 && (Dt = !0, typeof MessageChannel > "u" && v("This browser does not have a MessageChannel implementation, so enqueuing tasks via await act(async () => ...) will fail. Please file an issue at https://github.com/facebook/react/issues if you encounter this warning."));
              var g = new MessageChannel();
              g.port1.onmessage = p, g.port2.postMessage(void 0);
            };
          }
        return xe(e);
      }
      var ge = 0, Vt = !1;
      function Gt(e) {
        {
          var r = ge;
          ge++, O.current === null && (O.current = []);
          var c = O.isBatchingLegacy, u;
          try {
            if (O.isBatchingLegacy = !0, u = e(), !c && O.didScheduleLegacyUpdate) {
              var p = O.current;
              p !== null && (O.didScheduleLegacyUpdate = !1, ot(p));
            }
          } catch (U) {
            throw Fe(r), U;
          } finally {
            O.isBatchingLegacy = c;
          }
          if (u !== null && typeof u == "object" && typeof u.then == "function") {
            var g = u, m = !1, y = {
              then: function(U, x) {
                m = !0, g.then(function(D) {
                  Fe(r), ge === 0 ? rt(D, U, x) : U(D);
                }, function(D) {
                  Fe(r), x(D);
                });
              }
            };
            return !Vt && typeof Promise < "u" && Promise.resolve().then(function() {
            }).then(function() {
              m || (Vt = !0, v("You called act(async () => ...) without await. This could lead to unexpected testing behaviour, interleaving multiple act calls and mixing their scopes. You should - await act(async () => ...);"));
            }), y;
          } else {
            var S = u;
            if (Fe(r), ge === 0) {
              var T = O.current;
              T !== null && (ot(T), O.current = null);
              var $ = {
                then: function(U, x) {
                  O.current === null ? (O.current = [], rt(S, U, x)) : U(S);
                }
              };
              return $;
            } else {
              var j = {
                then: function(U, x) {
                  U(S);
                }
              };
              return j;
            }
          }
        }
      }
      function Fe(e) {
        e !== ge - 1 && v("You seem to have overlapping act() calls, this is not supported. Be sure to await previous act() calls before making a new one. "), ge = e;
      }
      function rt(e, r, c) {
        {
          var u = O.current;
          if (u !== null)
            try {
              ot(u), tr(function() {
                u.length === 0 ? (O.current = null, r(e)) : rt(e, r, c);
              });
            } catch (p) {
              c(p);
            }
          else
            r(e);
        }
      }
      var st = !1;
      function ot(e) {
        if (!st) {
          st = !0;
          var r = 0;
          try {
            for (; r < e.length; r++) {
              var c = e[r];
              do
                c = c(!0);
              while (c !== null);
            }
            e.length = 0;
          } catch (u) {
            throw e = e.slice(r + 1), u;
          } finally {
            st = !1;
          }
        }
      }
      var nr = xt, rr = Zn, sr = qn, or = {
        map: Me,
        forEach: vn,
        count: gn,
        toArray: yn,
        only: bn
      };
      t.Children = or, t.Component = E, t.Fragment = l, t.Profiler = _, t.PureComponent = I, t.StrictMode = f, t.Suspense = C, t.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = te, t.act = Gt, t.cloneElement = rr, t.createContext = An, t.createElement = nr, t.createFactory = sr, t.createRef = nn, t.forwardRef = Rn, t.isValidElement = _e, t.lazy = En, t.memo = kn, t.startTransition = er, t.unstable_act = Gt, t.useCallback = Mn, t.useContext = On, t.useDebugValue = Hn, t.useDeferredValue = xn, t.useEffect = Pn, t.useId = Fn, t.useImperativeHandle = Un, t.useInsertionEffect = $n, t.useLayoutEffect = jn, t.useMemo = Ln, t.useReducer = Cn, t.useRef = In, t.useState = Tn, t.useSyncExternalStore = Dn, t.useTransition = Nn, t.version = n, typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop == "function" && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(new Error());
    }();
  }(Oe, Oe.exports)), Oe.exports;
}
var Kt;
function gr() {
  return Kt || (Kt = 1, process.env.NODE_ENV === "production" ? Ge.exports = _r() : Ge.exports = mr()), Ge.exports;
}
gr();
function Zt() {
  return typeof window < "u" && ("__TAURI_INTERNALS__" in window || "__TAURI__" in window);
}
window.IsDesktopApp = Zt;
function V(s, t, n, o) {
  if (typeof t == "function" ? s !== t || !0 : !t.has(s)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return n === "m" ? o : n === "a" ? o.call(s) : o ? o.value : t.get(s);
}
function Ee(s, t, n, o, a) {
  if (typeof t == "function" ? s !== t || !0 : !t.has(s)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return t.set(s, n), n;
}
var le, Z, ve, We;
const Xt = "__TAURI_TO_IPC_KEY__";
function vr(s, t = !1) {
  return window.__TAURI_INTERNALS__.transformCallback(s, t);
}
class yr {
  constructor(t) {
    le.set(this, void 0), Z.set(this, 0), ve.set(this, []), We.set(this, void 0), Ee(this, le, t || (() => {
    })), this.id = vr((n) => {
      const o = n.index;
      if ("end" in n) {
        o == V(this, Z, "f") ? this.cleanupCallback() : Ee(this, We, o);
        return;
      }
      const a = n.message;
      if (o == V(this, Z, "f")) {
        for (V(this, le, "f").call(this, a), Ee(this, Z, V(this, Z, "f") + 1); V(this, Z, "f") in V(this, ve, "f"); ) {
          const l = V(this, ve, "f")[V(this, Z, "f")];
          V(this, le, "f").call(this, l), delete V(this, ve, "f")[V(this, Z, "f")], Ee(this, Z, V(this, Z, "f") + 1);
        }
        V(this, Z, "f") === V(this, We, "f") && this.cleanupCallback();
      } else
        V(this, ve, "f")[o] = a;
    });
  }
  cleanupCallback() {
    window.__TAURI_INTERNALS__.unregisterCallback(this.id);
  }
  set onmessage(t) {
    Ee(this, le, t);
  }
  get onmessage() {
    return V(this, le, "f");
  }
  [(le = /* @__PURE__ */ new WeakMap(), Z = /* @__PURE__ */ new WeakMap(), ve = /* @__PURE__ */ new WeakMap(), We = /* @__PURE__ */ new WeakMap(), Xt)]() {
    return `__CHANNEL__:${this.id}`;
  }
  toJSON() {
    return this[Xt]();
  }
}
async function Ye(s, t = {}, n) {
  return window.__TAURI_INTERNALS__.invoke(s, t, n);
}
const Be = "Request cancelled";
async function Qt(s, t) {
  const n = t == null ? void 0 : t.signal;
  if (n != null && n.aborted)
    throw new Error(Be);
  const o = t == null ? void 0 : t.maxRedirections, a = t == null ? void 0 : t.connectTimeout, l = t == null ? void 0 : t.proxy, f = t == null ? void 0 : t.danger;
  t && (delete t.maxRedirections, delete t.connectTimeout, delete t.proxy, delete t.danger);
  const _ = t != null && t.headers ? t.headers instanceof Headers ? t.headers : new Headers(t.headers) : new Headers(), h = new Request(s, t), b = await h.arrayBuffer(), R = b.byteLength !== 0 ? Array.from(new Uint8Array(b)) : null;
  for (const [O, H] of h.headers)
    _.get(O) || _.set(O, H);
  const C = (_ instanceof Headers ? Array.from(_.entries()) : Array.isArray(_) ? _ : Object.entries(_)).map(([O, H]) => [
    O,
    // we need to ensure we have all header values as strings
    // eslint-disable-next-line
    typeof H == "string" ? H : H.toString()
  ]);
  if (n != null && n.aborted)
    throw new Error(Be);
  const W = await Ye("plugin:http|fetch", {
    clientConfig: {
      method: h.method,
      url: h.url,
      headers: C,
      data: R,
      maxRedirections: o,
      connectTimeout: a,
      proxy: l,
      danger: f
    }
  }), P = () => Ye("plugin:http|fetch_cancel", { rid: W });
  if (n != null && n.aborted)
    throw P(), new Error(Be);
  n == null || n.addEventListener("abort", () => void P());
  const { status: F, statusText: X, url: z, headers: ne, rid: se } = await Ye("plugin:http|fetch_send", {
    rid: W
  }), oe = [101, 103, 204, 205, 304].includes(F) ? null : new ReadableStream({
    start: (O) => {
      const H = new yr();
      H.onmessage = (Q) => {
        if (n != null && n.aborted) {
          O.error(Be);
          return;
        }
        const q = new Uint8Array(Q), de = q[q.byteLength - 1], ce = q.slice(0, q.byteLength - 1);
        if (de == 1) {
          O.close();
          return;
        }
        O.enqueue(ce);
      }, Ye("plugin:http|fetch_read_body", {
        rid: se,
        streamChannel: H
      }).catch((Q) => {
        O.error(Q);
      });
    }
  }), J = new Response(oe, {
    status: F,
    statusText: X
  });
  return Object.defineProperty(J, "url", { value: z }), Object.defineProperty(J, "headers", {
    value: new Headers(ne)
  }), J;
}
function Te(s, t) {
  return Zt() ? t !== void 0 ? Qt(s, t) : Qt(s) : t !== void 0 ? fetch(s, t) : fetch(s);
}
window.FetchProxy = Te;
class K {
  constructor() {
    Ve(this, "ApiTargets", {});
    this.ApiTargets = {
      GoggleApi: ke.GOOGLE_API,
      FunnelApi: ke.FUNNEL_API,
      CdnApi: ke.CDN_API,
      GravatarApi: ke.GRAVATAR_API
    };
  }
  getApiSchemeAndHost() {
    return ut.getInstance().getApiSchemeAndHost();
  }
  async fetch(t, {
    method: n,
    query: o,
    body: a
  }) {
    const l = o && Object.entries(o).reduce(
      (b, [R, C]) => (C && (b[R] = C.toString()), b),
      {}
    ), f = l ? t + "?" + new URLSearchParams(l) : t, _ = JSON.stringify(a), h = await Te(f, {
      method: n,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: _
    });
    if (!h.ok)
      throw new Error(`HTTP error! status: ${h.status}`);
    return h.json();
  }
  async fetchMultipartFormData(t, {
    method: n,
    body: o
  }) {
    return (await Te(t, {
      method: n,
      headers: {
        Accept: "application/json"
      },
      credentials: "include",
      body: o
    })).json();
  }
  get({
    endpoint: t,
    query: n
  }) {
    return this.fetch(t, { method: "GET", query: n });
  }
  post({
    endpoint: t,
    query: n,
    body: o
  }) {
    return this.fetch(t, {
      method: "POST",
      query: n,
      body: o
    });
  }
  delete({
    endpoint: t,
    query: n,
    body: o
  }) {
    return this.fetch(t, {
      method: "DELETE",
      query: n,
      body: o
    });
  }
  async postFormVideo({
    endpoint: t,
    formRecord: n,
    uuid: o,
    blob: a,
    blobFileName: l
  }) {
    const f = new FormData();
    return f.append("uuid_idempotency_token", o), Object.entries(n).forEach(([_, h]) => {
      f.append(_, h);
    }), a && l ? f.append("video", a, l) : a && f.append("video", a), this.fetchMultipartFormData(t, {
      method: "POST",
      body: f
    });
  }
  async postForm({
    endpoint: t,
    formRecord: n,
    uuid: o,
    blob: a,
    blobFileName: l
  }) {
    const f = new FormData();
    return f.append("uuid_idempotency_token", o), Object.entries(n).forEach(([_, h]) => {
      f.append(_, h);
    }), a && l ? f.append("file", a, l) : a && f.append("file", a), this.fetchMultipartFormData(t, {
      method: "POST",
      body: f
    });
  }
  camelToSnakeCase(t) {
    return t.replace(/([a-z0])([A-Z])/g, "$1_$2").toLowerCase();
  }
  parseQueryValues(t) {
    return Object.entries(t).reduce(
      (n, [o, a]) => {
        if (!a)
          return n;
        const l = this.camelToSnakeCase(o);
        return Array.isArray(a) ? { ...n, [l]: a.join(",") } : { ...n, [l]: a.toString() };
      },
      {}
    );
  }
  parseBodyValues(t) {
    return Object.entries(t).reduce((n, [o, a]) => {
      if (!a)
        return n;
      const l = this.camelToSnakeCase(o);
      return Array.isArray(a) ? { ...n, [l]: a } : { ...n, [l]: a };
    }, {});
  }
}
class $r extends K {
  PostAnalytics({
    maybeLastAction: t,
    maybeLogToken: n
  }) {
    const o = `${this.getApiSchemeAndHost()}/v1/analytics/log_session`, a = {
      maybe_last_action: t,
      maybe_log_token: n
    };
    return this.post({ endpoint: o, body: a }).then((l) => ({
      success: l.success ?? !1,
      data: l.log_token,
      errorMessage: l.BadInput
    })).catch((l) => ({ success: !1, errorMessage: l.message }));
  }
}
class jr extends K {
  async ListActiveSubscriptions() {
    const t = `${this.getApiSchemeAndHost()}/v1/billing/active_subscriptions`;
    return await this.get({ endpoint: t }).then((n) => ({
      success: n.success,
      data: {
        active_subscriptions: n.active_subscriptions || [],
        maybe_loyalty_program: n.maybe_loyalty_program
      }
    })).catch((n) => ({
      success: !1,
      errorMessage: n.message
    }));
  }
}
class Mr extends K {
  async ConvertTbxToGltf({
    mediaFileToken: t,
    uuidIdempotencyToken: n
  }) {
    const o = `${this.getApiSchemeAndHost()}/v1/conversion/enqueue_fbx_to_gltf`, a = {
      media_file_token: t,
      uuid_idempotency_token: n
    };
    return this.post({
      endpoint: o,
      body: a
    }).then((l) => ({
      success: l.success ?? !1,
      data: l.inference_job_token,
      errorMessage: l.BadInput
    })).catch((l) => ({
      success: !1,
      errorMessage: l.message
    }));
  }
  async uploadSceneSnapshot({
    screenshot: t,
    sceneMediaToken: n
  }) {
    const o = `${this.getApiSchemeAndHost()}/v1/image_studio/scene_snapshot`, a = new FormData();
    a.append("snapshot", t), n && a.append("scene_media_token", n);
    const l = crypto.randomUUID();
    a.append("uuid_idempotency_token", l);
    const _ = await (await fetch(o, {
      method: "POST",
      headers: {
        Accept: "application/json"
      },
      credentials: "include",
      body: a
    })).json();
    console.log(_);
    let h;
    return _.success ? h = {
      success: !0,
      data: _.snapshot_media_token,
      errorMessage: void 0
    } : h = {
      success: !1,
      errorMessage: _.BadInput
    }, h;
  }
  async enqueueImageGeneration({
    disableSystemPrompt: t,
    prompt: n,
    snapshotMediaToken: o,
    additionalImages: a
  }) {
    const l = `${this.getApiSchemeAndHost()}/v1/image_studio/prompt`, _ = {
      uuid_idempotency_token: crypto.randomUUID(),
      disable_system_prompt: t,
      prompt: n,
      snapshot_media_token: o,
      // Changed from scene_media_token to snapshot_media_token
      additional_images: a
    }, h = await this.post({
      endpoint: l,
      body: _
    }), b = h.success ?? !1;
    return {
      success: b,
      data: b ? h.job_token : void 0,
      errorMessage: b ? void 0 : h.BadInput
    };
  }
  async pollJobSession(t) {
    const n = `${this.getApiSchemeAndHost()}/v1/jobs/session/${t}`, o = await this.get({
      endpoint: n
    }), a = o.success ?? !1, l = o.status ?? "", f = o.result ?? {
      generated_images: [],
      error: void 0
    }, _ = o.BadInput;
    return {
      success: a,
      data: { status: l, result: f },
      errorMessage: _
    };
  }
  async pollStudioSessionJobs(t) {
    const n = `${this.getApiSchemeAndHost()}/v1/image_studio/session_jobs/${t}`, o = await this.get({
      endpoint: n
    }), a = o.success ?? !1, l = o.status ?? "", f = o.result ?? {
      generated_images: [],
      error: void 0
    }, _ = o.BadInput;
    return {
      success: a,
      data: { status: l, result: f },
      errorMessage: _
    };
  }
}
class Lr extends K {
  GetPreviewStatusByJobToken({
    token: t
  }) {
    const n = `${this.getApiSchemeAndHost()}/v1/workflows/preview_status/${t}`;
    return this.get({ endpoint: n }).then((o) => ({
      success: o.success,
      data: o.data
    })).catch((o) => ({ success: !1, errorMessage: o.message }));
  }
  GetJobByToken({
    token: t
  }) {
    const n = `${this.getApiSchemeAndHost()}/v1/jobs/job/${t}`;
    return this.get({ endpoint: n }).then((o) => ({
      success: o.success,
      data: o.state
    })).catch((o) => ({ success: !1, errorMessage: o.message }));
  }
  ListJobs() {
    const t = `${this.getApiSchemeAndHost()}/v1/jobs/batch`;
    return this.get({ endpoint: t }).then((n) => ({
      success: n.success,
      data: n.job_states
    })).catch((n) => ({ success: !1, errorMessage: n.message }));
  }
  ListRecentJobs() {
    const t = `${this.getApiSchemeAndHost()}/v1/jobs/session`;
    return this.get({ endpoint: t }).then((n) => ({
      success: n.success,
      data: n.jobs
    })).catch((n) => ({ success: !1, errorMessage: n.message }));
  }
  DeleteJobByToken(t) {
    const n = `${this.getApiSchemeAndHost()}/v1/jobs/job/${t}`;
    return this.delete({ endpoint: n }).then((o) => ({
      success: o.success
    })).catch((o) => ({ success: !1, errorMessage: o.message }));
  }
}
class br extends K {
  async DeleteMediaFileByToken({
    mediaFileToken: t,
    asMod: n = !0,
    setDelete: o = !0
  }) {
    const a = `${this.getApiSchemeAndHost()}/v1/media_files/file/${t}`, l = { as_mod: n, set_delete: o };
    return await this.delete({ endpoint: a, body: l }).then((f) => ({
      success: f.success ?? !1,
      errorMessage: f.BadInput
    })).catch((f) => ({
      success: !1,
      errorMessage: f.message
    }));
  }
  async ListMediaFilesByTokens({
    mediaTokens: t
  }) {
    const n = `${this.getApiSchemeAndHost()}/v1/media_files/batch`;
    return await this.get({ endpoint: n, query: { tokens: t.join(",") } }).then((o) => ({
      success: o.success,
      data: o.media_files
    })).catch((o) => ({ success: !1, errorMessage: o.message }));
  }
  async GetMediaFileByToken({
    mediaFileToken: t
  }) {
    const n = `${this.getApiSchemeAndHost()}/v1/media_files/file/${t}`;
    return await this.get({ endpoint: n }).then((o) => ({
      success: o.success,
      data: o.media_file
    })).catch((o) => ({
      success: !1,
      errorMessage: o.message
    }));
  }
  async ListMediaFiles(t) {
    const n = `${this.getApiSchemeAndHost()}/v1/media_files/list`, o = {
      ...t,
      filter_media_classes: t.filter_media_classes ? t.filter_media_classes.join(",") : void 0,
      filter_media_type: t.filter_media_type ? t.filter_media_type.join(",") : void 0,
      filter_engine_categories: t.filter_engine_categories ? t.filter_engine_categories.join(",") : void 0
    };
    return await this.get({ endpoint: n, query: o }).then((a) => ({
      success: a.success,
      data: a.results ?? [],
      pagination: a.pagination
    })).catch((a) => ({
      success: !1,
      errorMessage: a.message
    }));
  }
  async ListFeaturedMediaFiles(t) {
    const n = `${this.getApiSchemeAndHost()}/v1/media_files/list_featured`, o = {
      ...t,
      filter_media_classes: t.filter_media_classes ? t.filter_media_classes.join(",") : void 0,
      filter_media_type: t.filter_media_type ? t.filter_media_type.join(",") : void 0,
      filter_engine_categories: t.filter_engine_categories ? t.filter_engine_categories.join(",") : void 0
    };
    return await this.get({ endpoint: n, query: o }).then((a) => ({
      success: !0,
      data: a.results,
      pagination: a.pagination
    })).catch((a) => ({
      success: !1,
      errorMessage: a.message
    }));
  }
  async ListUserMediaFiles(t) {
    const n = t.username, o = `${this.getApiSchemeAndHost()}/v1/media_files/list/user/${n}`, a = {
      ...t,
      include_user_uploads: t.include_user_uploads,
      filter_media_classes: t.filter_media_classes ? t.filter_media_classes.join(",") : void 0,
      filter_media_type: t.filter_media_type ? t.filter_media_type.join(",") : void 0,
      filter_engine_categories: t.filter_engine_categories ? t.filter_engine_categories.join(",") : void 0
    };
    return await this.get({ endpoint: o, query: a }).then((l) => {
      let f = l.results ?? [];
      return t.user_uploads_only && (f = f.filter((_) => _.origin_category === "upload")), {
        success: l.success,
        data: f,
        pagination: l.pagination
      };
    }).catch((l) => ({
      success: !1,
      errorMessage: l.message
    }));
  }
  async SearchFeaturedMediaFiles(t) {
    const n = `${this.getApiSchemeAndHost()}/v1/media_files/search_featured`, o = {
      search_term: t.search_term,
      filter_media_classes: t.filter_media_classes ? t.filter_media_classes.join(",") : void 0,
      filter_media_type: t.filter_media_type ? t.filter_media_type.join(",") : void 0,
      filter_engine_categories: t.filter_engine_categories ? t.filter_engine_categories.join(",") : void 0
    };
    return await this.get({ endpoint: n, query: o }).then((a) => ({
      success: !0,
      data: a.results,
      pagination: a.pagination
    })).catch((a) => ({
      success: !1,
      errorMessage: a.message
    }));
  }
  async SearchUserMediaFiles(t) {
    const n = `${this.getApiSchemeAndHost()}/v1/media_files/search_session`, o = {
      search_term: t.search_term,
      filter_media_classes: t.filter_media_classes ? t.filter_media_classes.join(",") : void 0,
      filter_media_type: t.filter_media_type ? t.filter_media_type.join(",") : void 0,
      filter_engine_categories: t.filter_engine_categories ? t.filter_engine_categories.join(",") : void 0
    };
    return await this.get({ endpoint: n, query: o }).then((a) => ({
      success: !0,
      data: a.results,
      pagination: a.pagination
    })).catch((a) => ({
      success: !1,
      errorMessage: a.message
    }));
  }
  async RenameMediaFileByToken({
    mediaToken: t,
    name: n
  }) {
    const o = `${this.getApiSchemeAndHost()}/v1/media_files/rename/${t}`, a = { name: n };
    return await this.post({ endpoint: o, body: a }).then((l) => ({
      success: l.success ?? !1,
      errorMessage: l.BadInput
    })).catch((l) => ({ success: !1, errorMessage: l.message }));
  }
  async UpdateCoverImage({
    mediaFileToken: t,
    imageToken: n
  }) {
    const o = `${this.getApiSchemeAndHost()}/v1/media_files/cover_image/${t}`;
    return await this.post({ endpoint: o, body: { cover_image_media_file_token: n } }).then((a) => ({
      success: a.success ?? !1,
      errorMessage: a.BadInput
    })).catch((a) => ({
      success: !1,
      errorMessage: a.message
    }));
  }
  async UpdateVisibility({
    mediaFileToken: t,
    visibility: n
  }) {
    const o = `${this.getApiSchemeAndHost()}/v1/media_files/visibility/${t}`;
    return await this.post({ endpoint: o, body: { creator_set_visibility: n } }).then((a) => ({
      success: a.success ?? !1,
      errorMessage: a.BadInput
    })).catch((a) => ({
      success: !1,
      errorMessage: a.message
    }));
  }
}
var re = /* @__PURE__ */ ((s) => (s.Public = "public", s.Hidden = "hidden", s.Private = "private", s))(re || {}), it = /* @__PURE__ */ ((s) => (s[s.true = 0] = "true", s[s.false = 1] = "false", s))(it || {});
class Ur extends K {
  constructor() {
    super(...arguments);
    Ve(this, "sessionToken", "");
  }
  async getSessionTokenForUploadStudioShot() {
    const n = `${this.getApiSchemeAndHost()}/v1/session_token`;
    return await this.get({ endpoint: n }).then((o) => ({
      success: !0,
      data: o.maybe_signed_session
    })).catch((o) => ({
      success: !1,
      errorMessage: o.message
    }));
  }
  async UploadStudioShot({
    maybe_title: n,
    uuid_idempotency_token: o,
    blob: a,
    fileName: l,
    maybe_visibility: f
  }) {
    const _ = `${this.ApiTargets.uploadApi}/v1/media_files/upload/studio_shot`;
    if (this.sessionToken)
      console.log(`Session Token: ${this.sessionToken}`);
    else {
      console.log("Session Token");
      const P = await this.getSessionTokenForUploadStudioShot();
      if (P.success && P.data)
        this.sessionToken = P.data, console.log(`Token ${this.sessionToken}`);
      else
        return {
          success: !1,
          errorMessage: "Could not obtain session tokens."
        };
    }
    const h = {
      maybe_title: n,
      maybe_frame_rate_fps: 60,
      maybe_visibility: f == null ? void 0 : f.toString()
    }, b = Object.entries(h).reduce(
      (P, [F, X]) => X === void 0 ? P : { ...P, [F]: X.toString() },
      {}
    ), R = new FormData();
    R.append("uuid_idempotency_token", o), Object.entries(b).forEach(([P, F]) => {
      R.append(P, F);
    }), a && l ? R.append("file", a, l) : a && R.append("file", a);
    const W = await (await fetch(_, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Session: this.sessionToken
      },
      credentials: "include",
      body: R
    })).json();
    return W.success && W.media_file_token ? { success: !0, data: W.media_file_token } : { success: !1, errorMessage: "Failed to Get Media Token" };
  }
  async Upload({
    endpoint: n,
    uuid: o,
    blob: a,
    fileName: l,
    options: f
  }) {
    const _ = Object.entries(f).reduce(
      (h, [b, R]) => R === void 0 ? h : { ...h, [b]: R.toString() },
      {}
    );
    return await this.postForm({ endpoint: n, formRecord: _, blob: a, blobFileName: l, uuid: o }).then((h) => ({
      success: !!(h.success ?? !1),
      data: h.media_file_token,
      errorMessage: h.BadInput
    })).catch((h) => ({
      success: !1,
      errorMessage: h.message
    }));
  }
  async UploadAudio({
    blob: n,
    fileName: o,
    uuid: a,
    maybe_title: l,
    maybe_visibility: f = re.Public
  }) {
    const _ = `${this.getApiSchemeAndHost()}/v1/media_files/upload/audio`, h = {
      maybe_title: l,
      maybe_visibility: f == null ? void 0 : f.toString()
    };
    return this.Upload({ endpoint: _, blob: n, fileName: o, uuid: a, options: h });
  }
  async UploadImage({
    blob: n,
    fileName: o,
    uuid: a,
    maybe_title: l,
    maybe_visibility: f = re.Public,
    is_intermediate_system_file: _ = it.true
  }) {
    const h = `${this.getApiSchemeAndHost()}/v1/media_files/upload/image`, b = {
      is_intermediate_system_file: it[_],
      maybe_title: l,
      maybe_visibility: f == null ? void 0 : f.toString()
    };
    return this.Upload({ endpoint: h, blob: n, fileName: o, uuid: a, options: b });
  }
  async UploadNewEngineAsset({
    file: n,
    fileName: o,
    uuid: a,
    engine_category: l,
    maybe_animation_type: f,
    maybe_duration_millis: _,
    maybe_title: h,
    maybe_visibility: b = re.Public
  }) {
    const R = `${this.getApiSchemeAndHost()}/v1/media_files/upload/new_engine_asset`, C = {
      engine_category: l,
      maybe_title: h,
      maybe_visibility: b == null ? void 0 : b.toString(),
      maybe_animation_type: f,
      maybe_duration_millis: _
    };
    return this.Upload({ endpoint: R, blob: n, fileName: o, uuid: a, options: C });
  }
  async UploadNewScene({
    blob: n,
    fileName: o,
    uuid: a,
    maybe_title: l,
    maybe_visibility: f = re.Public
  }) {
    const _ = `${this.getApiSchemeAndHost()}/v1/media_files/upload/new_scene`, h = {
      maybe_title: l,
      maybe_visibility: f == null ? void 0 : f.toString()
    };
    return this.Upload({ endpoint: _, blob: n, fileName: o, uuid: a, options: h });
  }
  async UploadNewVideo({
    blob: n,
    fileName: o,
    uuid: a,
    maybe_title: l,
    maybe_visibility: f = re.Public,
    maybe_style_name: _,
    maybe_scene_source_media_file_token: h
  }) {
    const b = `${this.getApiSchemeAndHost()}/v1/media_files/upload/new_video`, R = {
      is_intermediate_system_file: "true",
      maybe_title: l,
      maybe_visibility: f == null ? void 0 : f.toString(),
      maybe_style_name: _,
      maybe_scene_source_media_file_token: h
    };
    return this.Upload({ endpoint: b, blob: n, fileName: o, uuid: a, options: R });
  }
  async UploadPmx({
    file: n,
    fileName: o,
    uuid: a,
    engine_category: l,
    maybe_animation_type: f,
    maybe_duration_millis: _,
    maybe_title: h,
    maybe_visibility: b = re.Public
  }) {
    const R = `${this.getApiSchemeAndHost()}/v1/media_files/upload/pmx`, C = {
      is_intermediate_system_file: "true",
      engine_category: l,
      maybe_animation_type: f,
      maybe_duration_millis: _,
      maybe_title: h,
      maybe_visibility: b
    };
    return this.Upload({ endpoint: R, blob: n, fileName: o, uuid: a, options: C });
  }
  async UploadSavedScene({
    blob: n,
    fileName: o,
    uuid: a,
    mediaToken: l
  }) {
    const f = `${this.getApiSchemeAndHost()}/v1/media_files/upload/saved_scene/${l}`, _ = {};
    return this.Upload({ endpoint: f, blob: n, fileName: o, uuid: a, options: _ });
  }
  // this is used to send the scene snapshot to the vst upload endpoint this creates a snapshot of the scene where in we can remix from the og.
  async UploadSceneSnapshotMediaFileForm({
    blob: n,
    uuid: o,
    maybe_title: a,
    // title of the scene at the time
    maybe_scene_source_media_file_token: l
    // original token that started it all
  }) {
    const f = `${this.getApiSchemeAndHost()}/v1/media_files/upload/scene_snapshot`, _ = {
      maybe_title: a,
      maybe_scene_source_media_file_token: l
    }, h = `${a}-${o}`;
    return this.Upload({ endpoint: f, blob: n, fileName: h, uuid: o, options: _ });
  }
}
class Hr extends K {
  GetStatusAlertCheck() {
    const t = `${this.getApiSchemeAndHost()}/v1/session`;
    return this.get({ endpoint: t }).then((n) => ({
      success: n.success,
      data: {
        ...n.maybe_alert,
        refresh_interval_millis: n.refresh_interval_millis
      }
    })).catch((n) => ({
      success: !1,
      errorMessage: n.mesasge
    }));
  }
}
function G(s, t, n, o) {
  if (typeof t == "function" ? s !== t || !0 : !t.has(s)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return n === "m" ? o : n === "a" ? o.call(s) : o ? o.value : t.get(s);
}
function Re(s, t, n, o, a) {
  if (typeof t == "function" ? s !== t || !0 : !t.has(s)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return t.set(s, n), n;
}
var fe, ee, ye, ze;
const qt = "__TAURI_TO_IPC_KEY__";
function Ar(s, t = !1) {
  return window.__TAURI_INTERNALS__.transformCallback(s, t);
}
class wr {
  constructor(t) {
    fe.set(this, void 0), ee.set(this, 0), ye.set(this, []), ze.set(this, void 0), Re(this, fe, t || (() => {
    })), this.id = Ar((n) => {
      const o = n.index;
      if ("end" in n) {
        o == G(this, ee, "f") ? this.cleanupCallback() : Re(this, ze, o);
        return;
      }
      const a = n.message;
      if (o == G(this, ee, "f")) {
        for (G(this, fe, "f").call(this, a), Re(this, ee, G(this, ee, "f") + 1); G(this, ee, "f") in G(this, ye, "f"); ) {
          const l = G(this, ye, "f")[G(this, ee, "f")];
          G(this, fe, "f").call(this, l), delete G(this, ye, "f")[G(this, ee, "f")], Re(this, ee, G(this, ee, "f") + 1);
        }
        G(this, ee, "f") === G(this, ze, "f") && this.cleanupCallback();
      } else
        G(this, ye, "f")[o] = a;
    });
  }
  cleanupCallback() {
    window.__TAURI_INTERNALS__.unregisterCallback(this.id);
  }
  set onmessage(t) {
    Re(this, fe, t);
  }
  get onmessage() {
    return G(this, fe, "f");
  }
  [(fe = /* @__PURE__ */ new WeakMap(), ee = /* @__PURE__ */ new WeakMap(), ye = /* @__PURE__ */ new WeakMap(), ze = /* @__PURE__ */ new WeakMap(), qt)]() {
    return `__CHANNEL__:${this.id}`;
  }
  toJSON() {
    return this[qt]();
  }
}
async function en(s, t = {}, n) {
  return window.__TAURI_INTERNALS__.invoke(s, t, n);
}
async function Sr(s, t, n, o, a) {
  const l = new Uint32Array(1);
  window.crypto.getRandomValues(l);
  const f = l[0], _ = new wr();
  await en("plugin:upload|download", {
    id: f,
    url: s,
    filePath: t,
    headers: {},
    onProgress: _,
    body: a
  });
}
var ct;
(function(s) {
  s[s.Audio = 1] = "Audio", s[s.Cache = 2] = "Cache", s[s.Config = 3] = "Config", s[s.Data = 4] = "Data", s[s.LocalData = 5] = "LocalData", s[s.Document = 6] = "Document", s[s.Download = 7] = "Download", s[s.Picture = 8] = "Picture", s[s.Public = 9] = "Public", s[s.Video = 10] = "Video", s[s.Resource = 11] = "Resource", s[s.Temp = 12] = "Temp", s[s.AppConfig = 13] = "AppConfig", s[s.AppData = 14] = "AppData", s[s.AppLocalData = 15] = "AppLocalData", s[s.AppCache = 16] = "AppCache", s[s.AppLog = 17] = "AppLog", s[s.Desktop = 18] = "Desktop", s[s.Executable = 19] = "Executable", s[s.Font = 20] = "Font", s[s.Home = 21] = "Home", s[s.Runtime = 22] = "Runtime", s[s.Template = 23] = "Template";
})(ct || (ct = {}));
async function Er() {
  return en("plugin:path|resolve_directory", {
    directory: ct.Download
  });
}
const Nr = async (s) => {
  console.log("GOT THE URL", s);
  try {
    let n = new URL(s).pathname.split("/").pop();
    (!n || n === "") && (n = "downloaded_file");
    const a = `${await Er()}/${n}`;
    await Sr(s, a), console.log(
      `File downloaded and saved as ${n} in downloads folder`
    );
  } catch (t) {
    throw console.error("Error downloading file:", t), t;
  }
};
class xr extends K {
  async enqueueImageGeneration({
    disableSystemPrompt: t,
    prompt: n,
    snapshotMediaToken: o,
    additionalImages: a
  }) {
    const l = `${this.getApiSchemeAndHost()}/v1/image_studio/prompt`, _ = {
      uuid_idempotency_token: crypto.randomUUID(),
      disable_system_prompt: t,
      prompt: n,
      snapshot_media_token: o,
      // Changed from scene_media_token to snapshot_media_token
      additional_images: a
    }, h = await this.post({
      endpoint: l,
      body: _
    }), b = h.success ?? !1;
    return console.log("postResponse FOR ENQUEUE IMAGE GENERATION"), console.log(h), {
      success: b,
      data: b ? h.job_token : void 0,
      errorMessage: b ? void 0 : h.BadInput
    };
  }
  async pollJobSession(t, n = 256) {
    var W, P, F, X, z, ne;
    const o = `${this.getApiSchemeAndHost()}/v1/jobs/job/${t}`, a = await this.get({
      endpoint: o
    });
    console.log("Job Polling Response:"), console.log(a);
    const l = (P = (W = a.state.maybe_result) == null ? void 0 : W.media_links) == null ? void 0 : P.cdn_url, f = (F = a.state.maybe_result) == null ? void 0 : F.maybe_public_bucket_media_path, _ = (ne = (z = (X = a.state.maybe_result) == null ? void 0 : X.media_links) == null ? void 0 : z.maybe_thumbnail_template) == null ? void 0 : ne.replace(
      "{WIDTH}",
      n.toString()
    ), h = a.state.status.progress_percentage, b = a.state.status.status;
    console.log("Image URL:", l), console.log("Thumbnail URL:", _), console.log("Progress Percentage:", h), console.log("Status", b), console.log("response FROM JOBS"), console.log(a);
    const R = a.success ?? !1;
    a.status;
    const C = a.BadInput;
    return {
      success: R,
      data: {
        result: {
          image_url: l || "",
          thumbnail_url: _ || "",
          public_bucket_path: f || "",
          error: void 0
        },
        job_token: t,
        request: {
          maybe_model_title: "Image Generation"
        },
        status: {
          status: b.toLowerCase(),
          progress_percentage: h
        }
      },
      errorMessage: C
    };
  }
  async pollStudioSessionJobs(t) {
    const n = `${this.getApiSchemeAndHost()}/v1/image_studio/session_jobs/${t}`, o = await this.get({
      endpoint: n
    }), a = o.success ?? !1, l = o.status ?? "", f = o.result ?? {
      generated_images: [],
      error: void 0
    }, _ = o.BadInput;
    return {
      success: a,
      data: { status: l, result: f },
      errorMessage: _
    };
  }
  GetPromptsByToken({
    token: t
  }) {
    const n = `${this.getApiSchemeAndHost()}/v1/prompts/${t}`;
    return this.get({ endpoint: n }).then((o) => ({
      success: o.success,
      data: o.prompt
    })).catch((o) => ({ success: !1, errorMessage: o.message }));
  }
  async uploadSceneSnapshot({
    screenshot: t,
    sceneMediaToken: n
  }) {
    const o = `${this.getApiSchemeAndHost()}/v1/image_studio/scene_snapshot`, a = new FormData();
    a.append("snapshot", t), n && a.append("scene_media_token", n);
    const l = crypto.randomUUID();
    a.append("uuid_idempotency_token", l);
    const _ = await (await Te(o, {
      method: "POST",
      headers: {
        Accept: "application/json"
      },
      credentials: "include",
      body: a
    })).json();
    console.log(_);
    let h;
    return _.success ? h = {
      success: !0,
      data: _.snapshot_media_token,
      errorMessage: void 0
    } : h = {
      success: !1,
      errorMessage: "Failed to generate snapshot."
    }, h;
  }
}
var tn = /* @__PURE__ */ ((s) => (s.BadRequest = "bad_request", s.NotFound = "not_found", s.TooManyRequests = "too_many_requests", s.ServerError = "server_error", s.UnknownError = "unknown_error", s))(tn || {});
class Fr extends K {
  async GenerateTtsAudio(t) {
    const n = `${this.getApiSchemeAndHost()}/v1/tts/inference`, o = {
      ...t,
      ...t.creator_set_visibility ? {} : { creator_set_visibility: re.Public }
    };
    return this.post({
      endpoint: n,
      body: o
    }).then((a) => a.success ? {
      success: !0,
      data: {
        inference_job_token: a.inference_job_token,
        inference_job_token_type: a.inference_job_token_type
      }
    } : {
      success: !1,
      errorMessage: a.BadInput,
      data: {}
    }).catch(() => ({
      success: !1,
      errorMessage: tn.UnknownError,
      data: {}
    }));
  }
}
var Rr = /* @__PURE__ */ ((s) => (s.USER = "user", s.TTS_MODEL = "tts-model", s.TTS_RESULT = "tts-result", s.W2L_TEMPLATE = "w2l-template", s.W2L_RESULT = "w2l-result", s.MEDIA_FILE = "media_file", s.MODEL_WEIGHT = "model_weight", s.VOICE_CONVERSION_MODEL = "voice_conversion_model", s.ZS_VOICE = "z_voice", s))(Rr || {}), kr = /* @__PURE__ */ ((s) => (s.HIFIGAN_TTl2 = "hifigan_tt2", s.RVC_V2 = "rvc_v2", s.SD_1_5 = "sd_1.5", s.SDXL = "sdxl", s.SO_VITS_SVC = "so_vits_svc", s.TT2 = "tt2", s.LORA = "loRA", s.VALL_E = "vall_e", s.COMFY_UI = "comfy_ui", s))(kr || {}), Or = /* @__PURE__ */ ((s) => (s.IMAGE_GENERATION = "image_generation", s.TEXT_TO_SPEECH = "text_to_speech", s.VOCODER = "vocoder", s.VOICE_CONVERSION = "voice_conversion", s.WORKFLOW_CONFIG = "workflow_config", s))(Or || {});
class Dr extends K {
  CreateUserBookmark({
    entityToken: t,
    entityType: n
  }) {
    const o = `${this.getApiSchemeAndHost()}/v1/user_bookmarks/create`, a = {
      entity_token: t,
      entity_type: n
    };
    return this.post({ endpoint: o, body: a }).then((l) => ({
      success: l.success ?? !1,
      data: {
        new_bookmark_count_for_entity: l.new_bookmark_count_for_entity,
        user_bookmark_token: l.user_bookmark_token
      },
      errorMessage: l.BadInput
    })).catch((l) => ({ success: !1, errorMessage: l.message }));
  }
  DeleteUserBookmark({
    entityToken: t
  }) {
    const n = `${this.getApiSchemeAndHost()}/v1/user_bookmarks/delete/${t}`;
    return this.delete({ endpoint: n, body: { as_mod: !0 } }).then((o) => ({
      success: o.success ?? !1,
      errorMessage: o.BadInput
    })).catch((o) => ({ success: !1, errorMessage: o.message }));
  }
  ListUserBookmarks() {
    const t = `${this.getApiSchemeAndHost()}/v1/user_bookmarks/batch`;
    return this.get({ endpoint: t }).then((n) => ({
      success: n.success ?? !1,
      data: n.bookmarks,
      errorMessage: n.BadInput
    })).catch((n) => ({ success: !1, errorMessage: n.message }));
  }
  ListUserBookmarksByUser({
    username: t,
    sort_ascending: n,
    page_size: o,
    page_index: a,
    maybe_scoped_entity_type: l,
    maybe_scoped_weight_type: f,
    maybe_scoped_media_file_type: _
  }) {
    const h = t, b = `${this.getApiSchemeAndHost()}/v1/user_bookmarks/list/${h}`, R = {
      sort_ascending: n,
      page_size: o,
      page_index: a,
      maybe_scoped_entity_type: l ? l.join(",") : void 0,
      maybe_scoped_weight_type: f ? f.join(",") : void 0,
      maybe_scoped_media_file_type: _ ? _.join(",") : void 0
    };
    return this.get({ endpoint: b, query: R }).then((C) => ({
      success: C.success ?? !1,
      data: C.results,
      pagination: C.pagination
    })).catch((C) => ({ success: !1, errorMessage: C.message }));
  }
  ListUserBookmarksByEntity({
    entityType: t,
    entityToken: n
  }) {
    const o = `${this.getApiSchemeAndHost()}/v1/user_bookmarks/list/${t}/${n}`;
    return this.get({ endpoint: o }).then((a) => ({
      success: !0,
      data: a.user_bookmarks
    })).catch((a) => ({ success: !1, errorMessage: a.message }));
  }
}
class Tr extends K {
  async authFetch(t, {
    method: n,
    body: o
  }) {
    const a = JSON.stringify(o);
    return await (await Te(t, {
      method: n,
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
    return this.get({ endpoint: t }).then((n) => ({
      success: n.success,
      data: {
        loggedIn: n.logged_in,
        user: n.user
      }
    })).catch((n) => ({
      success: !1,
      errorMessage: n.message
    }));
  }
  GetUserProfile(t) {
    const n = `${this.getApiSchemeAndHost()}/v1/user/${t}/profile`;
    return console.log("endpoint", n), this.get({ endpoint: n }).then((o) => ({
      success: o.success,
      data: {
        user: o.user
      }
    })).catch((o) => ({
      success: !1,
      errorMessage: o.message
    }));
  }
  async Login({
    usernameOrEmail: t,
    password: n
  }) {
    console.log("libs/api - Logging in with usernameOrEmail:", t);
    const o = `${this.getApiSchemeAndHost()}/v1/login`;
    console.log("libs/api - Login endpoint", o);
    const a = {
      username_or_email: t,
      password: n
    };
    try {
      const l = await this.authFetch(o, {
        method: "POST",
        body: a
      });
      return {
        success: l.success,
        data: l.success ? { signedSession: l.signed_session } : void 0,
        errorMessage: l.error_message
      };
    } catch (l) {
      return {
        success: !1,
        errorMessage: l.message
      };
    }
  }
  Logout() {
    const t = `${this.getApiSchemeAndHost()}/v1/logout`;
    return this.post({
      endpoint: t
    }).then((n) => ({
      success: n.success
    })).catch((n) => ({
      success: !1,
      errorMessage: n.message
    }));
  }
  async Signup({
    username: t,
    email: n,
    password: o,
    passwordConfirmation: a,
    signupSource: l
  }) {
    const f = `${this.getApiSchemeAndHost()}/v1/create_account`, _ = {
      email_address: n,
      password: o,
      password_confirmation: a,
      username: t
    };
    l && (_.signup_source = l);
    try {
      const h = await this.authFetch(f, {
        method: "POST",
        body: _
      });
      return {
        success: h.success,
        data: h.success ? { signedSession: h.signed_session } : void 0,
        errorMessage: h.error_message || Object.values(h.error_fields ?? {}).join(", ")
      };
    } catch (h) {
      return {
        success: !1,
        errorMessage: h.message
      };
    }
  }
}
window.UsersApi = new Tr();
class Vr extends K {
  async EnqueueStudio({
    enqueueVideo: t
  }) {
    const n = `${this.getApiSchemeAndHost()}/v1/workflows/enqueue_studio`, o = {
      ...t,
      ...t.creator_set_visibility ? {} : { creator_set_visibility: re.Public }
    };
    return await this.post({ endpoint: n, body: o }).then((a) => ({
      success: !!(a.success ?? !1),
      data: {
        inference_job_token: a.inference_job_token,
        inference_job_token_type: a.inference_job_token_type
      },
      errorMessage: a.BadInput
    })).catch((a) => (console.log(a.message), { success: !1, error_reason: a.message }));
  }
}
var Cr = /* @__PURE__ */ ((s) => (s.HIFIGAN_TT2 = "hifigan_tt2", s.RVC_V2 = "rvc_v2", s.SD_1_5 = "sd_1.5", s.SDXL = "sdxl", s.SO_VITS_SVC = "so_vits_svc", s.TT2 = "tt2", s.LORA = "loRA", s.VALL_E = "vall_e", s.COMFY_UI = "comfy_ui", s))(Cr || {}), Ir = /* @__PURE__ */ ((s) => (s.IMAGE_GENERATION = "image_generation", s.TEXT_TO_SPEECH = "text_to_speech", s.VOCODER = "vocoder", s.VOICE_CONVERSION = "voice_conversion", s.WORKFLOW_CONFIG = "workflow_config", s))(Ir || {});
class Gr extends K {
  ListWeightsByUser({
    username: t,
    ...n
  }) {
    const o = t, a = `${this.getApiSchemeAndHost()}/v1/weights/by_user/${o}`, l = this.parseQueryValues(n);
    return this.get({ endpoint: a, query: l }).then((f) => ({
      success: !0,
      data: f.results,
      pagination: f.pagination
    })).catch((f) => ({ success: !1, errorMessage: f.message }));
  }
  ListWeights({
    ...t
  }) {
    const n = `${this.getApiSchemeAndHost()}/v1/weights/list`, o = this.parseQueryValues(t);
    return this.get({ endpoint: n, query: o }).then((a) => ({
      success: !0,
      data: a.results,
      pagination: a.pagination
    })).catch((a) => ({ success: !1, errorMessage: a.message }));
  }
  ListWeightsFeatured({
    ...t
  }) {
    const n = `${this.getApiSchemeAndHost()}/v1/weights/list_featured`, o = this.parseQueryValues(t);
    return this.get({ endpoint: n, query: o }).then((a) => ({
      success: !0,
      data: a.results,
      pagination: a.pagination
    })).catch((a) => ({ success: !1, errorMessage: a.message }));
  }
  ListWeightsPinned() {
    const t = `${this.getApiSchemeAndHost()}/v1/weights/list_pinned`;
    return this.get({ endpoint: t }).then((n) => ({
      success: !0,
      data: n.results
    })).catch((n) => ({ success: !1, errorMessage: n.message }));
  }
  SearchWeights(t) {
    const n = `${this.getApiSchemeAndHost()}/v1/weights/search`, o = this.parseBodyValues(
      t
    );
    return this.post({ endpoint: n, body: o }).then((a) => ({
      success: !0,
      data: a.weights
    })).catch((a) => ({ success: !1, errorMessage: a.message }));
  }
  GetWeightByToken({
    weightToken: t
  }) {
    const n = `${this.getApiSchemeAndHost()}/v1/weights/weight/${t}`;
    return this.get({ endpoint: n }).then(({ success: o, ...a }) => ({
      success: o,
      data: a
    })).catch((o) => ({ success: !1, errorMessage: o.message }));
  }
  UpdateWeightByToken({
    weightToken: t,
    ...n
  }) {
    const o = `${this.getApiSchemeAndHost()}/v1/weights/weight/${t}`, a = this.parseBodyValues(n);
    return this.post({ endpoint: o, body: a }).then(({ success: l, BadInput: f }) => ({
      success: l ?? !1,
      errorMessage: f
    })).catch((l) => ({ success: !1, errorMessage: l.message }));
  }
  DeleteWeightByToken({
    weightToken: t
  }) {
    const n = `${this.getApiSchemeAndHost()}/v1/weights/weight/${t}`, o = {
      as_mod: !0,
      set_delete: !0
    };
    return this.delete({ endpoint: n, body: o }).then(({ success: a, BadInput: l }) => ({
      success: a ?? !1,
      errorMessage: l
    })).catch((a) => ({ success: !1, errorMessage: a.message }));
  }
  UpdateWeightCoverImageByToken({
    weightToken: t,
    coverImageMediaFileToken: n
  }) {
    const o = `${this.getApiSchemeAndHost()}/v1/weights/${t}/cover_image`, a = {
      cover_image_media_file_token: n
    };
    return this.post({ endpoint: o, body: a }).then(({ success: l, BadInput: f }) => ({
      success: l ?? !1,
      errorMessage: f
    })).catch((l) => ({ success: !1, errorMessage: l.message }));
  }
}
function Wr() {
  return "https://cdn-2.fakeyou.com";
}
class Yr extends br {
  constructor() {
    super();
  }
  async listUserMediaFiles(t) {
    return await this.ListUserMediaFiles({
      ...t,
      filter_media_classes: t.filter_media_classes,
      filter_media_type: t.filter_media_type,
      filter_engine_categories: t.filter_engine_categories,
      username: t.username,
      user_uploads_only: t.user_uploads_only,
      include_user_uploads: t.include_user_uploads,
      page_index: t.page_index,
      page_size: t.page_size
    });
  }
}
export {
  $r as AnalyticsApi,
  jr as BillingApi,
  Mr as EngineApi,
  pr as FilterEngineCategories,
  fr as FilterMediaClasses,
  dr as FilterMediaType,
  Yr as GalleryModalApi,
  Wr as GetCdnOrigin,
  Lr as JobsApi,
  br as MediaFilesApi,
  Ur as MediaUploadApi,
  Hr as MiscApi,
  xr as PromptsApi,
  Rr as ScopedEntityTypes,
  Or as ScopedMediaFileType,
  Ir as ScopedWeightCategory,
  Cr as ScopedWeightType,
  kr as ScopedWeightTypes,
  ut as StorytellerApiHostStore,
  Fr as TtsApi,
  Dr as UserBookmarksApi,
  Tr as UsersApi,
  Vr as VideoApi,
  Gr as WeightsApi,
  Nr as downloadFileFromUrl
};
