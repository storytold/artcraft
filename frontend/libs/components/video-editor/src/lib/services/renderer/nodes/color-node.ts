import { BaseNode } from "./base-node";

export type ColorNodeParams = {
  color: string;
};

export class ColorNode extends BaseNode<ColorNodeParams> {}
