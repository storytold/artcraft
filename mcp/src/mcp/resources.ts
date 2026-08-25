import { type McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";

import { hasScope } from "../tokens/principal";
import { GENERATION_KINDS, listModels } from "./tools/list-models";
import type { ToolContext } from "./tools/types";
import { ToolFailure, UpstreamSessionInvalid } from "./tools/types";

/**
 * `artcraft://models/{kind}` — the model catalogue as a readable resource, for clients that
 * prefetch context rather than calling tools (Claude Code, Cursor). Same data as list_models,
 * same scope; registered only when the principal may read the catalogue.
 */

export const MODELS_RESOURCE_TEMPLATE = "artcraft://models/{kind}";

export function registerCatalogueResource(server: McpServer, context: ToolContext): boolean {
  if (!hasScope(context.principal, listModels.requiredScope)) return false;

  const template = new ResourceTemplate(MODELS_RESOURCE_TEMPLATE, {
    list: () => ({
      resources: GENERATION_KINDS.map((kind) => ({
        uri: `artcraft://models/${kind}`,
        name: `${kind} models`,
        title: `Artcraft ${kind} models`,
        description: `Every ${kind} generation model Artcraft offers, with capabilities and option lists.`,
        mimeType: "application/json",
      })),
    }),
  });

  server.registerResource(
    "models",
    template,
    {
      title: "Artcraft model catalogues",
      description:
        "The generation models Artcraft offers, one document per kind (image, video, audio, " +
        "mesh, splat), as JSON. The same data list_models returns.",
      mimeType: "application/json",
    },
    async (uri, variables) => {
      const kind = String(variables.kind);
      if (!GENERATION_KINDS.some((known) => known === kind)) {
        throw new Error(
          `Unknown catalogue "${kind}"; expected one of ${GENERATION_KINDS.join(", ")}.`,
        );
      }
      try {
        const result = await listModels.handler(context, {
          kind: kind as (typeof GENERATION_KINDS)[number],
        });
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "application/json",
              text: JSON.stringify(result.structured, null, 2),
            },
          ],
        };
      } catch (error) {
        if (error instanceof ToolFailure || error instanceof UpstreamSessionInvalid) {
          throw new Error(error.message, { cause: error });
        }
        throw error;
      }
    },
  );
  return true;
}
