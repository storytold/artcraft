/**
 * Token generation, mirroring `crates/schema/public/tokens`.
 *
 * Tokens are Crockford base32 with a Stripe-like prefix, and the prefix counts
 * toward the total length. Some frontend code branches on the prefix, so the
 * fake uses the real ones.
 *
 * The generator is a seeded PRNG rather than `Math.random`, so a fresh server
 * always produces the same tokens in the same order. That keeps snapshot-style
 * tests stable across runs.
 */

const CROCKFORD_LOWER = "0123456789abcdefghjkmnpqrstvwxyz";
const DEFAULT_TOKEN_LENGTH = 32;
const DEFAULT_SEED = 0x5f37_59df;

export const TOKEN_PREFIX = {
  apiKey: "api_key_",
  appSession: "app_session_",
  batchGeneration: "batch_g_",
  character: "character_",
  folder: "folder_",
  inferenceJob: "jinf_",
  mediaFile: "m_",
  mediaUpload: "mu_",
  modelWeight: "weight_",
  prompt: "prompt_",
  tag: "tag_",
  user: "user_",
  userBookmark: "ub_",
  wallet: "wallet_",
} as const;

export type TokenPrefix = (typeof TOKEN_PREFIX)[keyof typeof TOKEN_PREFIX];

/** User tokens are 18 characters total; everything else is 32. */
const TOKEN_LENGTH_OVERRIDES: Partial<Record<TokenPrefix, number>> = {
  [TOKEN_PREFIX.user]: 18,
};

let nextRandom = mulberry32(DEFAULT_SEED);

/** Generate a token with the given prefix, e.g. `m_00f2h...`. */
export function makeToken(prefix: TokenPrefix): string {
  const totalLength = TOKEN_LENGTH_OVERRIDES[prefix] ?? DEFAULT_TOKEN_LENGTH;
  const entropyLength = Math.max(1, totalLength - prefix.length);

  let entropy = "";
  for (let index = 0; index < entropyLength; index += 1) {
    entropy += CROCKFORD_LOWER[Math.floor(nextRandom() * CROCKFORD_LOWER.length)];
  }

  return prefix + entropy;
}

/** A bare uuid-shaped identifier, for the idempotency and request ids the API echoes back. */
export function makeUuid(): string {
  const hex = "0123456789abcdef";
  let out = "";
  for (let index = 0; index < 32; index += 1) {
    if (index === 8 || index === 12 || index === 16 || index === 20) {
      out += "-";
    }
    out += hex[Math.floor(nextRandom() * hex.length)];
  }
  return out;
}

/** Restart the token stream. Called by the state reset endpoint so tests replay identically. */
export function resetTokenSequence(seed = DEFAULT_SEED): void {
  nextRandom = mulberry32(seed);
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b_79f5) >>> 0;
    let drawn = Math.imul(state ^ (state >>> 15), 1 | state);
    drawn = (drawn + Math.imul(drawn ^ (drawn >>> 7), 61 | drawn)) ^ drawn;
    return ((drawn ^ (drawn >>> 14)) >>> 0) / 4_294_967_296;
  };
}
