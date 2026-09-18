
// NOTE: These are defined in Rust (as the source of truth) and duplicated in the frontend.
// In the future, we should use code gen (protobufs or similar) to keep the two sides in sync.

export enum CommonQuality {
  Auto = "auto",
  Max = "max",
  XHigh = "xhigh",
  High = "high",
  Medium = "medium",
  Low = "low",
}
