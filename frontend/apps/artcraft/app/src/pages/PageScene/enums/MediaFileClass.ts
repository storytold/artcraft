export enum MediaFileClass {
  /// Unknown (default value)
  /// This will be present until we migrate all old files.
  Unknown = "unknown",

  /// Audio files: wav, mp3, etc.
  Audio = "audio",

  /// Image files: png, jpeg, etc.
  Image = "image",

  /// Video files: mp4, etc.
  Video = "video",

  /// Engine "animations"
  Animation = "animation",

  /// Engine "characters"
  Character = "character",

  /// Engine "prop" items
  Prop = "prop",

  /// Engine scenes (internal and external scenes)
  Scene = "scene",
}
