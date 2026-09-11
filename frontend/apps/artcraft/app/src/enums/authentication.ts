export enum STORAGE_KEYS {
  SESSION_TOKEN = "session_token",
}

export enum AUTH_STATUS {
  INIT = "INIT",
  NO_ACCESS = "no_access",
  LOGGED_IN = "logged_in",
  LOGGING = "logging",
  GET_USER_INFO = "get_user_info",
  LOGGED_OUT = "logged_out",
}

export enum AUTH_ERROR_FALLBACKS {
  CreateSessionError = "Unknown Error during Create Session",
  DestorySessionError = "Unknown Error during Destroy Session",
  GetSessionError = "Unknown Error During Get Session",
  Unauthorized = "User Unauthorized",
}

export enum USER_FEATURE_FLAGS {
  EXPLORE_MEDIA = "explore_media",
  STUDIO = "studio",
  UPLOAD_3D = "upload_3d",
  VIDEO_STYLE_TRANSFER = "video_style_transfer",
}
