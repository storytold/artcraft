export enum toEngineActions {
  ADD_CLIP = "add_clip",
  // data=QueueClip
  ADD_KEYFRAME = "add_keyframe",

  ADD_CHARACTER = "add_character",

  ADD_OBJECT = "add_object",

  ADD_SHAPE = "add_shape",

  // data= QueueKeyframe
  DELETE_CLIP = "delete_clip",
  // data=QueueClip
  DELETE_KEYFRAME = "delete_keyframe",
  // data=QueueKeyframe
  ENTER_EDIT_STATE = "enter_edit",
  // data=null
  ENTER_PREVIEW_STATE = "enter_preview",
  // data=null
  GENERATE_VIDEO = "generate_video",
  // data=null
  MUTE = "mute",
  // data={version, type, group, object_uuid} if lipsync
  // data={version, type, group} if global_audio
  REFRESH_PREVIEW = "refresh_preview",
  // data=QueueClip
  TOGGLE_CAMERA_STATE = "toggle_camera",
  // data=null
  TOGGLE_REPEATING = "toggle_repeating",
  // data=null

  CHANGE_CAMERA_ASPECT_RATIO = "change_camera_aspect_ratio",
  // data=CamperaAspectRatio

  CAMERA_CHANGED = "camera_changed",

  UNMUTE = "unmute",
  // data={version, type, group, object_uuid} if lipsync
  // data={version, type, group} if global_audio
  UPDATE_CLIP = "update_clip",
  // data=QueueClip
  UPDATE_KEYFRAME = "update_keyframe",
  // data=QueueKeyframe
  UPDATE_TIME = "update_time",
  // data={currentTime: number}
}
