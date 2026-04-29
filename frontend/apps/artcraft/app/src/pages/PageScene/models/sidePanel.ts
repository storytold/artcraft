import { ReactNode } from "react";
import { AssetType } from "~/enums";

export interface Tab {
  icon: string;
  title: string;
  value: AssetType;
  component: ReactNode;
}
