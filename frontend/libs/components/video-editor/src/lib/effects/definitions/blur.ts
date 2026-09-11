import type { EffectDefinition, EffectPass } from "../types";

export const GAUSSIAN_BLUR_SHADER = "gaussian-blur";

// Sigma-step + iteration math for Gaussian blur. The single-pass kernel
// in the shader caps at MAX_SINGLE_PASS_SIGMA pixels of effective
// radius; for larger blurs we split across multiple iterations and
// scale the step distance proportionally.

const MAX_SINGLE_PASS_SIGMA = 10;
const MAX_STEP = 4;
const MAX_EFFECTIVE_SIGMA = MAX_SINGLE_PASS_SIGMA * MAX_STEP;
const MAX_ITERATIONS = 8;

export function buildGaussianBlurPasses({
  sigmaX,
  sigmaY,
}: {
  sigmaX: number;
  sigmaY: number;
}): EffectPass[] {
  const maxSigma = Math.max(sigmaX, sigmaY);
  if (maxSigma < 0.001) return [];

  const iterations = Math.min(
    MAX_ITERATIONS,
    Math.max(
      1,
      Math.ceil(
        (maxSigma * maxSigma) /
          (MAX_EFFECTIVE_SIGMA * MAX_EFFECTIVE_SIGMA),
      ),
    ),
  );
  const perPassSigmaX = sigmaX / Math.sqrt(iterations);
  const perPassSigmaY = sigmaY / Math.sqrt(iterations);
  const stepX = Math.max(1, perPassSigmaX / MAX_SINGLE_PASS_SIGMA);
  const stepY = Math.max(1, perPassSigmaY / MAX_SINGLE_PASS_SIGMA);

  const passes: EffectPass[] = [];
  for (let i = 0; i < iterations; i++) {
    passes.push({
      shader: GAUSSIAN_BLUR_SHADER,
      uniforms: {
        u_sigma: perPassSigmaX,
        u_step: stepX,
        u_direction: [1, 0],
      },
    });
    passes.push({
      shader: GAUSSIAN_BLUR_SHADER,
      uniforms: {
        u_sigma: perPassSigmaY,
        u_step: stepY,
        u_direction: [0, 1],
      },
    });
  }
  return passes;
}

export const INTENSITY_TO_SIGMA_DIVISOR = 5;

export function intensityToSigma({
  intensity,
  resolution,
  reference,
}: {
  intensity: number;
  resolution: number;
  reference: number;
}): number {
  return (intensity / INTENSITY_TO_SIGMA_DIVISOR) * (resolution / reference);
}

function parseIntensity(effectParams: Record<string, unknown>): number {
  const raw = effectParams.intensity;
  return typeof raw === "number" ? raw : Number.parseFloat(String(raw));
}

export const blurEffectDefinition: EffectDefinition = {
  type: "blur",
  name: "Blur",
  keywords: ["blur", "soft", "defocus"],
  params: [
    {
      key: "intensity",
      label: "Intensity",
      type: "number",
      default: 15,
      min: 0,
      max: 100,
      step: 1,
    },
  ],
  renderer: {
    passes: [
      {
        shader: GAUSSIAN_BLUR_SHADER,
        uniforms: ({ effectParams, width }) => ({
          u_sigma: Math.max(intensityToSigma({ intensity: parseIntensity(effectParams), resolution: width, reference: 1920 }), 0.001),
          u_step: 1,
          u_direction: [1, 0],
        }),
      },
      {
        shader: GAUSSIAN_BLUR_SHADER,
        uniforms: ({ effectParams, height }) => ({
          u_sigma: Math.max(intensityToSigma({ intensity: parseIntensity(effectParams), resolution: height, reference: 1080 }), 0.001),
          u_step: 1,
          u_direction: [0, 1],
        }),
      },
    ],
    buildPasses: ({ effectParams, width, height }) => {
      const intensity = parseIntensity(effectParams);
      return buildGaussianBlurPasses({
        sigmaX: intensityToSigma({ intensity, resolution: width, reference: 1920 }),
        sigmaY: intensityToSigma({ intensity, resolution: height, reference: 1080 }),
      });
    },
  },
};
