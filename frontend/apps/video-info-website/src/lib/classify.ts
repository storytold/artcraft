import type { VideoInfoReadOnlyResponse } from '../api/types';

export type VerdictLevel = 'real' | 'fake' | 'unknown';

export interface Verdict {
  level: VerdictLevel;
  /** Whether to show the "You Might've Been Scammed!" banner. */
  scammed: boolean;
  /** The big yes/no headline. */
  headline: string;
  /** The prominent model name / type shown above the metadata table. */
  modelLabel: string;
  /** Short supporting line under the headline. */
  subline: string;
}

const FRIENDLY_MODEL_NAMES: Record<string, string> = {
  veo: 'Google Veo',
  sora: 'OpenAI Sora',
  dreamina: 'Dreamina',
  kling: 'Kling',
};

/**
 * Decide the verdict from the API response.
 *
 * Real Seedance 2.0 = a Seedance manifest whose model name is neither a `-fast`
 * nor a `mini` variant. Everything else is either a lesser Seedance variant, a
 * different model entirely, or unidentifiable.
 */
export function classify(response: VideoInfoReadOnlyResponse): Verdict {
  const seedance = response.maybe_seedance;

  if (seedance) {
    const name = (seedance.model_name || '').toLowerCase();

    if (name.includes('-fast')) {
      return {
        level: 'fake',
        scammed: true,
        headline: "No! It's Seedance 2.0 Fast (not Full)",
        modelLabel: seedance.model_name,
        subline: 'This is the faster, lower-quality variant — not full Seedance 2.0.',
      };
    }
    if (name.includes('mini')) {
      return {
        level: 'fake',
        scammed: true,
        headline: "No! It's Seedance 2.0 Mini (not Full)",
        modelLabel: seedance.model_name,
        subline: 'This is the Mini variant — not full Seedance 2.0.',
      };
    }
    return {
      level: 'real',
      scammed: false,
      headline: "Yes! It's Real Seedance 2.0",
      modelLabel: seedance.model_name,
      subline: 'Verified Seedance provenance with a full-model signature.',
    };
  }

  const friendly = FRIENDLY_MODEL_NAMES[response.kind];
  if (friendly) {
    return {
      level: 'fake',
      scammed: true,
      headline: `No! It's not Seedance 2.0. It's ${friendly}`,
      modelLabel: friendly,
      subline: `This video carries ${friendly} provenance.`,
    };
  }

  return {
    level: 'unknown',
    scammed: false,
    headline: "We don't know what that is.",
    modelLabel: 'Unknown',
    subline:
      'No recognized AI-generation provenance was found — it may have been re-encoded, stripping the metadata.',
  };
}
