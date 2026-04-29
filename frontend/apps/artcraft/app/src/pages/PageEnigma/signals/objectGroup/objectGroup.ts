import { signal } from "@preact/signals-core";
import { ObjectGroup } from "~/pages/PageEnigma/models";

export const objectGroup = signal<ObjectGroup>({
  id: "OB1",
  objects: [],
});
