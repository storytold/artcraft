import { useEffect as s } from "react";
function l(e, r = !1) {
  return window.__TAURI_INTERNALS__.transformCallback(e, r);
}
async function _(e, r = {}, a) {
  return window.__TAURI_INTERNALS__.invoke(e, r, a);
}
const P = async () => {
  try {
    return await _("storyteller_get_credits_command");
  } catch (e) {
    throw e;
  }
}, V = async () => {
  try {
    return await _("storyteller_get_subscription_command");
  } catch (e) {
    throw e;
  }
};
var c = /* @__PURE__ */ ((e) => (e.Success = "success", e))(c || {}), m = /* @__PURE__ */ ((e) => (e.BadRequest = "bad_request", e.Unauthorized = "unauthorized", e.ServerError = "server_error", e))(m || {}), u = /* @__PURE__ */ ((e) => (e.ModelNotSpecified = "model_not_specified", e.NoProviderAvailable = "no_provider_available", e.BadRequest = "bad_request", e.ServerError = "server_error", e.TooManyConcurrentTasks = "too_many_concurrent_tasks", e.SoraLoginRequired = "sora_login_required", e.SoraUsernameNotYetCreated = "sora_username_not_yet_created", e.SoraIsHavingProblems = "sora_is_having_problems", e))(u || {}), f = /* @__PURE__ */ ((e) => (e.GptImage1 = "gpt_image_1", e.FluxProKontextMax = "flux_pro_kontext_max", e))(f || {}), p = /* @__PURE__ */ ((e) => (e.Auto = "auto", e.Square = "square", e.Wide = "wide", e.Tall = "tall", e))(p || {}), g = /* @__PURE__ */ ((e) => (e.Auto = "auto", e.High = "high", e.Medium = "medium", e.Low = "low", e))(g || {});
const J = async (e) => {
  let r;
  if (e.model && (typeof e.model == "string" ? r = e.model : typeof e.model.tauriId == "string" && (r = e.model.tauriId)), !r)
    throw new Error("No model specified in request: " + JSON.stringify(e));
  let a = {
    model: r,
    prompt: e.prompt
  };
  return e.scene_image_media_token && (a.scene_image_media_token = e.scene_image_media_token), e.image_media_tokens && (a.image_media_tokens = e.image_media_tokens), e.aspect_ratio && (a.aspect_ratio = e.aspect_ratio), e.image_count && (a.image_count = e.image_count), e.image_quality && (a.image_quality = e.image_quality), e.disable_system_prompt && (a.disable_system_prompt = e.disable_system_prompt), await _("enqueue_contextual_edit_image_command", {
    request: a
  });
};
var v = /* @__PURE__ */ ((e) => (e.ModelNotSpecified = "model_not_specified", e.ServerError = "server_error", e.NeedsFalApiKey = "needs_fal_api_key", e.FalError = "fal_error", e))(v || {});
const Y = async (e) => {
  let r = {};
  return e.image_media_token && (r.image_media_token = e.image_media_token), e.base64_image && (r.base64_image = e.base64_image), e.frontend_caller && (r.frontend_caller = e.frontend_caller), e.frontend_subscriber_id && (r.frontend_subscriber_id = e.frontend_subscriber_id), await _("enqueue_image_bg_removal_command", {
    request: r
  });
};
var y = /* @__PURE__ */ ((e) => (e.ModelNotSpecified = "model_not_specified", e.NoProviderAvailable = "no_provider_available", e.BadRequest = "bad_request", e.ServerError = "server_error", e.TooManyConcurrentTasks = "too_many_concurrent_tasks", e.SoraLoginRequired = "sora_login_required", e.SoraUsernameNotYetCreated = "sora_username_not_yet_created", e.SoraIsHavingProblems = "sora_is_having_problems", e))(y || {}), b = /* @__PURE__ */ ((e) => (e.FluxPro1 = "flux_pro_1", e.FluxDevJuggernaut = "flux_dev_juggernaut", e))(b || {});
const B = async (e) => {
  let r;
  if (e.model && (typeof e.model == "string" ? r = e.model : "tauriId" in e.model && typeof e.model.tauriId == "string" ? r = e.model.tauriId : "tauri_id" in e.model && typeof e.model.tauri_id == "string" && (r = e.model.tauri_id)), !r)
    throw new Error("No model specified in request: " + JSON.stringify(e));
  let a = {
    model: r,
    prompt: e.prompt
  };
  return e.image_media_token && (a.image_media_token = e.image_media_token), e.mask_image_raw_bytes && (a.mask_image_raw_bytes = e.mask_image_raw_bytes), e.image_count && (a.image_count = e.image_count), e.frontend_caller && (a.frontend_caller = e.frontend_caller), e.frontend_subscriber_id && (a.frontend_subscriber_id = e.frontend_subscriber_id), await _("enqueue_image_inpaint_command", {
    request: a
  });
};
var w = /* @__PURE__ */ ((e) => (e.ModelNotSpecified = "model_not_specified", e.ServerError = "server_error", e.NeedsFalApiKey = "needs_fal_api_key", e.FalError = "fal_error", e.NeedsStorytellerCredentials = "needs_storyteller_credentials", e))(w || {}), k = /* @__PURE__ */ ((e) => (e.Hunyuan3d2 = "hunyuan_3d_2", e.Hunyuan3d2_0 = "hunyuan_3d_2_0", e.Hunyuan3d2_1 = "hunyuan_3d_2_1", e))(k || {});
const Z = async (e) => await _("enqueue_image_to_3d_object_command", {
  request: {
    image_media_token: e.image_media_token,
    model: e.model
  }
});
var S = /* @__PURE__ */ ((e) => (e.ModelNotSpecified = "model_not_specified", e.ServerError = "server_error", e.NeedsFalApiKey = "needs_fal_api_key", e.FalError = "fal_error", e))(S || {});
const X = async (e) => {
  var t;
  let r = {
    model: (t = e.model) == null ? void 0 : t.tauriId,
    image_media_token: e.image_media_token
  };
  return e.prompt && (r.prompt = e.prompt), e.end_frame_image_media_token && (r.end_frame_image_media_token = e.end_frame_image_media_token), e.frontend_caller && (r.frontend_caller = e.frontend_caller), e.frontend_subscriber_id && (r.frontend_subscriber_id = e.frontend_subscriber_id), await _("enqueue_image_to_video_command", {
    request: r
  });
};
var N = /* @__PURE__ */ ((e) => (e.ModelNotSpecified = "model_not_specified", e.ServerError = "server_error", e.NeedsFalApiKey = "needs_fal_api_key", e.FalError = "fal_error", e))(N || {}), h = /* @__PURE__ */ ((e) => (e.FluxProUltra = "flux_pro_ultra", e.GptImage1 = "gpt_image_1", e.Recraft3 = "recraft_3", e))(h || {}), A = /* @__PURE__ */ ((e) => (e.Auto = "auto", e.Square = "square", e.Wide = "wide", e.Tall = "tall", e))(A || {});
const $ = async (e) => {
  let r;
  if (e.model && (typeof e.model == "string" ? r = e.model : typeof e.model.tauriId == "string" && (r = e.model.tauriId)), !r)
    throw new Error("No model specified in request: " + JSON.stringify(e));
  let a = {
    model: r,
    prompt: e.prompt
  };
  return e.aspect_ratio && (a.aspect_ratio = e.aspect_ratio), e.number_images && (a.number_images = e.number_images), e.image_media_tokens && e.image_media_tokens.length > 0 && (a.image_media_tokens = e.image_media_tokens), e.frontend_caller && (a.frontend_caller = e.frontend_caller), e.frontend_subscriber_id && (a.frontend_subscriber_id = e.frontend_subscriber_id), await _("enqueue_text_to_image_command", {
    request: a
  });
};
var D = /* @__PURE__ */ ((e) => (e.Success = "success", e.Failure = "failure", e))(D || {}), i;
(function(e) {
  e.WINDOW_RESIZED = "tauri://resize", e.WINDOW_MOVED = "tauri://move", e.WINDOW_CLOSE_REQUESTED = "tauri://close-requested", e.WINDOW_DESTROYED = "tauri://destroyed", e.WINDOW_FOCUS = "tauri://focus", e.WINDOW_BLUR = "tauri://blur", e.WINDOW_SCALE_FACTOR_CHANGED = "tauri://scale-change", e.WINDOW_THEME_CHANGED = "tauri://theme-changed", e.WINDOW_CREATED = "tauri://window-created", e.WEBVIEW_CREATED = "tauri://webview-created", e.DRAG_ENTER = "tauri://drag-enter", e.DRAG_OVER = "tauri://drag-over", e.DRAG_DROP = "tauri://drag-drop", e.DRAG_LEAVE = "tauri://drag-leave";
})(i || (i = {}));
async function W(e, r) {
  window.__TAURI_EVENT_PLUGIN_INTERNALS__.unregisterListener(e, r), await _("plugin:event|unlisten", {
    event: e,
    eventId: r
  });
}
async function n(e, r, a) {
  var t;
  const o = (t = void 0) !== null && t !== void 0 ? t : { kind: "Any" };
  return _("plugin:event|listen", {
    event: e,
    target: o,
    handler: l(r)
  }).then((d) => async () => W(e, d));
}
const F = "canvas_bg_removed_event", j = (e) => {
  s(() => {
    let r = !1, a;
    return (async () => {
      a = n(F, async (o) => {
        await e(o.payload.data);
      }), r && a.then((o) => o());
    })(), () => {
      r = !0, a.then((o) => o());
    };
  }, []);
};
var R = /* @__PURE__ */ ((e) => (e.ServerError = "server_error", e.NeedsFalApiKey = "needs_fal_api_key", e))(R || {});
const Q = async (e) => await _("fal_background_removal_command", {
  request: {
    image_media_token: e.image_media_token,
    base64_image: e.base64_image
  }
});
var L = /* @__PURE__ */ ((e) => (e.ServerError = "server_error", e.NeedsFalApiKey = "needs_fal_api_key", e))(L || {});
const z = async (e) => await _("fal_hunyuan_image_to_3d_command", {
  request: {
    image_media_token: e.image_media_token,
    base64_image: e.base64_image
  }
});
var G = /* @__PURE__ */ ((e) => (e.ServerError = "server_error", e.NeedsFalApiKey = "needs_fal_api_key", e))(G || {});
const x = async (e) => await _("fal_kling_image_to_video_command", {
  request: {
    image_media_token: e.image_media_token,
    base64_image: e.base64_image
  }
}), I = async () => await _("get_fal_api_key_command"), E = async (e) => await _("set_fal_api_key_command", {
  request: {
    key: e
  }
}), T = async () => await _("midjourney_get_credential_info_command"), q = async () => await _("get_openai_api_key_command"), ee = async (e) => await _("set_openai_api_key_command", {
  request: {
    key: e
  }
}), re = async () => {
  try {
    return await _("get_provider_order_command");
  } catch (e) {
    throw e;
  }
};
var O = /* @__PURE__ */ ((e) => (e.ArtCraft = "artcraft", e.Fal = "fal", e.Sora = "sora", e))(O || {});
const ae = async (e) => await _("set_provider_order_command", {
  request: {
    providers: e.providers
  }
}), _e = async () => await _("get_app_preferences_command");
var U = /* @__PURE__ */ ((e) => (e.PreferredDownloadDirectory = "preferred_download_directory", e.PlaySounds = "play_sounds", e.EnqueueSuccessSound = "enqueue_success_sound", e.EnqueueFailureSound = "enqueue_failure_sound", e.GenerationSuccessSound = "generation_success_sound", e.GenerationFailureSound = "generation_failure_sound", e.GenerationEnqueueSound = "generation_enqueue_sound", e))(U || {});
const te = async (e) => await _("update_app_preferences_command", {
  request: {
    preference: e.preference,
    value: e.value
  }
});
var K = /* @__PURE__ */ ((e) => (e.NotSetUp = "not_set_up", e.ExpiredOrError = "expired_or_error", e.Valid = "valid", e))(K || {});
const oe = async () => {
  const e = await _("check_sora_session_command");
  return console.log(">>> sora result", e), e;
}, ne = async () => await _("sora_logout_command");
var H = /* @__PURE__ */ ((e) => (e.Square = "square", e.Wide = "wide", e.Tall = "tall", e))(H || {}), C = /* @__PURE__ */ ((e) => (e.ServerError = "server_error", e.TooManyConcurrentTasks = "too_many_concurrent_tasks", e.SoraIsHavingProblems = "sora_is_having_problems", e.SoraLoginRequired = "sora_login_required", e.SoraUsernameNotYetCreated = "sora_username_not_yet_created", e))(C || {});
const ie = async (e) => {
  try {
    return await _("sora_image_remix_command", {
      request: e
    });
  } catch (r) {
    let a = r;
    if ("status" in a)
      return a;
    throw r;
  }
};
function se(e) {
  s(() => {
    let r;
    return (async () => {
      r = await n(
        "sora-login-success",
        (o) => {
          e(o.payload);
        }
      );
    })(), () => {
      r && r();
    };
  }, [e]);
}
function de() {
  return new Promise((e) => {
    let r;
    n("sora-login-success", () => {
      r && r(), e();
    }).then((a) => {
      r = a;
    });
  });
}
const le = async () => {
  try {
    return await _("get_app_info_command");
  } catch (e) {
    throw e;
  }
}, ce = async (e) => {
  try {
    return await _("load_without_cors_command", { url: e });
  } catch (r) {
    throw console.error("LoadWithoutCors error", r), r;
  }
};
export {
  P as ArtcraftGetCredits,
  V as ArtcraftGetSubscription,
  D as BasicEventStatus,
  oe as CheckSoraSession,
  m as CommandErrorStatus,
  c as CommandSuccessStatus,
  J as EnqueueContextualEditImage,
  u as EnqueueContextualEditImageErrorType,
  f as EnqueueContextualEditImageModel,
  g as EnqueueContextualEditImageQuality,
  p as EnqueueContextualEditImageSize,
  Y as EnqueueImageBgRemoval,
  v as EnqueueImageBgRemovalErrorType,
  B as EnqueueImageInpaint,
  y as EnqueueImageInpaintErrorType,
  b as EnqueueImageInpaintModel,
  Z as EnqueueImageTo3dObject,
  w as EnqueueImageTo3dObjectErrorType,
  k as EnqueueImageTo3dObjectModel,
  X as EnqueueImageToVideo,
  S as EnqueueImageToVideoErrorType,
  $ as EnqueueTextToImage,
  N as EnqueueTextToImageErrorType,
  h as EnqueueTextToImageModel,
  A as EnqueueTextToImageSize,
  Q as FalBackgroundRemoval,
  R as FalBackgroundRemovalErrorType,
  z as FalHunyuanImageTo3d,
  L as FalHunyuanImageTo3dErrorType,
  x as FalKlingImageToVideo,
  G as FalKlingImageToVideoErrorType,
  le as GetAppInfo,
  _e as GetAppPreferences,
  I as GetFalApiKey,
  q as GetOpenAIApiKey,
  re as GetProviderOrder,
  ce as LoadWithoutCors,
  ne as LogoutSoraSession,
  T as MidjourneyGetCredentialInfo,
  U as PreferenceName,
  O as Provider,
  E as SetFalApiKey,
  ee as SetOpenAIApiKey,
  ae as SetProviderOrder,
  ie as SoraImageRemix,
  H as SoraImageRemixAspectRatio,
  C as SoraImageRemixErrorType,
  K as SoraSessionState,
  te as UpdateAppPreferences,
  j as useCanvasBgRemovedEvent,
  se as useSoraLoginListener,
  de as waitForSoraLogin
};
