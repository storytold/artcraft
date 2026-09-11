import { MAX_FEATHER } from "./feather";
import type { ParamDefinition } from "../params";
import type {
  BaseMaskParams,
  Mask,
  MaskDefaultContext,
  MaskDefinition,
  MaskParamUpdateArgs,
  MaskRenderer,
  MaskType,
} from "./types";
import { DefinitionRegistry } from "../params/registry";

// MaskIconProps replaces opencut's `@hugeicons/react` HugeiconsIconProps
// shape with a loose contract — the lib only cares that there's an
// `icon` and optional `strokeWidth`. Host code that passes Hugeicons
// (or any other icon component) can satisfy this via structural typing.
export type MaskIconProps = {
  // The icon — host-defined. Loosely typed so the lib doesn't
  // depend on a specific icon library; phase-2 panels can refine it.
  icon: unknown;
  strokeWidth?: number;
};

type RegisteredMaskWithoutId = Mask extends infer TMask
  ? TMask extends Mask
    ? Omit<TMask, "id">
    : never
  : never;

export type MaskDefinitionForRegistration = {
  [TType in MaskType]: MaskDefinition<TType>;
}[MaskType];

// Common params every mask shares — feather, stroke width, stroke
// color. Mask-specific params (shape-specific corners, text content,
// etc.) live on each definition and get appended to this base list.
export const BASE_MASK_PARAM_DEFINITIONS: ParamDefinition<
  keyof BaseMaskParams & string
>[] = [
  {
    key: "feather",
    label: "Feather",
    type: "number",
    default: 0,
    min: 0,
    max: MAX_FEATHER,
    step: 1,
    unit: "percent",
  },
  {
    key: "strokeWidth",
    label: "Stroke width",
    type: "number",
    default: 0,
    min: 0,
    max: 100,
    step: 1,
  },
  {
    key: "strokeColor",
    label: "Stroke color",
    type: "color",
    default: "#ffffff",
  },
];

export interface RegisteredMaskDefinition {
  type: MaskType;
  name: string;
  features: MaskDefinition["features"];
  params: ParamDefinition<string>[];
  renderer: MaskRenderer<BaseMaskParams>;
  interaction: MaskDefinition["interaction"];
  isActive?(params: BaseMaskParams): boolean;
  buildDefault(context: MaskDefaultContext): RegisteredMaskWithoutId;
  computeParamUpdate(
    args: MaskParamUpdateArgs<BaseMaskParams>,
  ): Partial<BaseMaskParams>;
  icon: MaskIconProps;
}

export class MasksRegistry extends DefinitionRegistry<
  MaskType,
  RegisteredMaskDefinition
> {
  constructor() {
    super("mask");
  }

  registerMask({
    definition,
    icon,
  }: {
    definition: MaskDefinitionForRegistration;
    icon: MaskIconProps;
  }): void {
    const withBaseParams: RegisteredMaskDefinition = {
      type: definition.type,
      name: definition.name,
      features: definition.features,
      params: [...definition.params, ...BASE_MASK_PARAM_DEFINITIONS],
      renderer: definition.renderer,
      interaction: definition.interaction,
      isActive: definition.isActive,
      buildDefault: definition.buildDefault,
      computeParamUpdate: definition.computeParamUpdate,
      icon,
    };
    this.register({
      key: definition.type,
      definition: withBaseParams,
    });
  }
}

export const masksRegistry = new MasksRegistry();
