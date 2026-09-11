
// NOTE: These are defined in Rust (as the source of truth) and duplicated in the frontend.
// In the future, we should use code gen (protobufs or similar) to keep the two sides in sync.

export type GenerationMode =
  | { type: "text_to_video" }
  | { type: "start_frame_to_video" }
  | { type: "start_and_end_frame_to_video" }
  | { type: "reference_image_to_video"; count: number };
