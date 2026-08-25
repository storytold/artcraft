import { z } from "zod";

import { READ_ONLY_ANNOTATIONS, type ToolDefinition, ToolFailure, unwrapUpstream } from "./types";

/**
 * Who the signed-in user is. Deliberately small: name, the feature flags that change what
 * they can do, and the account-setup facts that explain "why can't I…" questions. Credits and
 * plan live in get_credit_balance.
 */

const outputSchema = {
  username: z.string().describe("The user's Artcraft username."),
  display_name: z.string().describe("The name shown in the app."),
  feature_flags: z
    .array(z.string())
    .describe("Feature flags enabled on the account (e.g. api_key, upload_3d). Empty when none."),
  account_setup: z
    .object({
      email_set: z.boolean(),
      email_confirmed: z.boolean(),
      password_set: z.boolean(),
      username_customized: z.boolean(),
    })
    .describe("Onboarding state; a false value is something the user still has to do in the app."),
};

export const getAccount: ToolDefinition<Record<string, never>, typeof outputSchema> = {
  name: "get_account",
  title: "Get account",
  description:
    "Returns who is signed in to Artcraft: username, display name, enabled feature flags, and " +
    "account-setup state (email set/confirmed, password set, username customized). Use it to " +
    "address the user or to explain what their account can do. Takes no arguments. For credits " +
    "and plan, call get_credit_balance.",
  requiredScope: "read:account",
  inputSchema: {},
  outputSchema,
  annotations: { ...READ_ONLY_ANNOTATIONS, title: "Get account" },

  async handler({ upstream }) {
    const session = unwrapUpstream(await upstream.GET("/v1/session"));
    if (!session.logged_in || !session.user) {
      // The credential was accepted but identifies nobody: treat as an invalid session.
      throw new ToolFailure("Artcraft did not recognise this sign-in. Disconnect and reconnect.");
    }
    const { user } = session;
    const structured = {
      username: user.username,
      display_name: user.display_name,
      feature_flags: [...user.maybe_feature_flags],
      account_setup: {
        email_set: !user.onboarding.email_not_set,
        email_confirmed: !user.onboarding.email_not_confirmed,
        password_set: !user.onboarding.password_not_set,
        username_customized: !user.onboarding.username_not_customized,
      },
    };
    return { structured, text: describe(structured) };
  },
};

function describe(account: z.infer<z.ZodObject<typeof outputSchema>>): string {
  const flags = account.feature_flags.length > 0 ? account.feature_flags.join(", ") : "none";
  const todo = Object.entries(account.account_setup)
    .filter(([, done]) => !done)
    .map(([key]) => key.replace(/_/g, " "));
  const setup = todo.length > 0 ? `Still to do: ${todo.join(", ")}.` : "Account setup complete.";
  return `Signed in as ${account.username} (${account.display_name}). Feature flags: ${flags}. ${setup}`;
}
