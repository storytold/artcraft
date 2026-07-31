/**
 * Compile-time checks against `@storyteller/api`.
 *
 * The fake exists to behave like the real Rust backend, so its response shapes
 * are modelled on the Rust structs rather than on this package. Where the two
 * agree, though, binding them together is free insurance: if the frontend
 * changes one of these enums, `nx typecheck fake-storyteller-web` fails instead
 * of the fake quietly serving a value the app no longer understands.
 *
 * These are type-only imports, so nothing from `@storyteller/api` is loaded at
 * runtime — which matters, because its barrel touches `window` on import and
 * would crash under Node.
 *
 * DELIBERATELY NOT CHECKED: `MediaFileClass` and `MediaFileType`. Both are
 * stale in `@storyteller/api` relative to the backend, and locking to them
 * would force the fake to serve wrong values:
 *
 *   MediaFileClass  frontend has animation/character/prop/scene;
 *                   the backend emits dimensional/mesh/splat/project.
 *   MediaFileType   frontend has mmd/scene/none and is missing every concrete
 *                   type the backend actually sends (jpg, png, mp4, spz, ply,
 *                   scene_json, ...).
 *
 * Fixing those enums in `@storyteller/api` is tracked separately; see this
 * app's README for the full drift list.
 */

import type { JobStatus as FrontendJobStatus } from "@storyteller/api/enums/Job.js";
import type { Visibility as FrontendVisibility } from "@storyteller/api/enums/Visibility.js";
import type { JobStatus, Visibility } from "../state/entities.ts";

/** True only when both types accept exactly the same values. */
type Exact<Left, Right> = [Left] extends [Right] ? ([Right] extends [Left] ? true : false) : false;

type Assert<Condition extends true> = Condition;

/**
 * `${Enum}` widens a TypeScript string enum to the union of its literal values,
 * which is what a plain JSON payload actually contains.
 */
export type VisibilityMatchesFrontend = Assert<Exact<`${FrontendVisibility}`, Visibility>>;

export type JobStatusMatchesFrontend = Assert<Exact<`${FrontendJobStatus}`, JobStatus>>;
