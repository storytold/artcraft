import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { GENERATION_KINDS } from "./tools/list-models";

/**
 * `plan_generation` — one prompt that exercises the whole read-only surface: given a brief,
 * pick candidate models, price each, check the balance, and recommend. It spends nothing.
 */

export const PLAN_GENERATION_PROMPT = "plan_generation";

export function registerPlanGenerationPrompt(server: McpServer): void {
  server.registerPrompt(
    PLAN_GENERATION_PROMPT,
    {
      title: "Plan a generation",
      description:
        "Given a creative brief, work out which Artcraft models could produce it, what each " +
        "would cost, and whether the user's credits cover it — then recommend one. Read-only.",
      argsSchema: {
        brief: z.string().describe("What the user wants to make, in their words."),
        kind: z
          .string()
          .optional()
          .describe(
            `Optional: ${GENERATION_KINDS.join(", ")}. Inferred from the brief when omitted.`,
          ),
      },
    },
    ({ brief, kind }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Plan an Artcraft generation for this brief: "${brief}".`,
              kind
                ? `The kind of output is ${kind}.`
                : `First decide which kind of output fits (${GENERATION_KINDS.join(", ")}).`,
              "Steps:",
              "1. Call list_models for that kind and shortlist two or three models whose capabilities suit the brief (check supported inputs, aspect ratios, durations, batch sizes).",
              "2. For each shortlisted model, call estimate_cost with the parameters the brief implies, using only option values the model's capabilities allow.",
              "3. Call get_credit_balance to see what the user can spend.",
              "4. Recommend one model and one set of parameters, stating the estimated cost, whether the balance covers it, and any trade-off (quality, watermark, refund policy). Remind the user that estimates are public pricing and their plan may lower them.",
              "Do not generate anything; this is a plan.",
            ].join("\n"),
          },
        },
      ],
    }),
  );
}
