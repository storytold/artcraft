import { signal } from "@preact/signals-react";

export const selectedMode = signal("move");
export const showPoseControls = signal(false);
export const poseMode = signal("select");
export const transformSpace = signal<"world" | "local">("world");
