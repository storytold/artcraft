/** Route registration. Order matters where a literal path shares a shape with a `:param` one. */

import { Router } from "../http/router.ts";
import { registerAccountRoutes } from "./account.ts";
import { registerBillingRoutes } from "./billing.ts";
import { registerCharacterRoutes } from "./characters.ts";
import { registerControlRoutes } from "./control.ts";
import { registerFolderRoutes } from "./folders.ts";
import { registerJobRoutes } from "./jobs.ts";
import { registerLegacyRoutes } from "./legacy.ts";
import { registerMediaFileRoutes } from "./media_files.ts";
import { registerMediaServingRoutes } from "./media_serving.ts";
import { registerMediaUploadRoutes } from "./media_upload.ts";
import { registerOmniGenRoutes } from "./omni_gen.ts";
import { registerPromptRoutes } from "./prompts.ts";
import { registerSessionRoutes } from "./session.ts";
import { registerTagRoutes } from "./tags.ts";

export function buildRouter(): Router {
  const router = new Router();

  registerControlRoutes(router);
  registerMediaServingRoutes(router);

  registerSessionRoutes(router);
  registerBillingRoutes(router);
  registerOmniGenRoutes(router);
  registerJobRoutes(router);

  // Uploads register `/v1/media_files/upload/...`, which must be matched before
  // the reading routes' `/v1/media_files/:something` patterns.
  registerMediaUploadRoutes(router);
  registerMediaFileRoutes(router);

  registerFolderRoutes(router);
  registerTagRoutes(router);
  registerPromptRoutes(router);
  registerCharacterRoutes(router);
  registerAccountRoutes(router);
  registerLegacyRoutes(router);

  return router;
}
