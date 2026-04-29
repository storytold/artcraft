import { CharacterGroup } from "~/pages/PageEnigma/models";
import { signal } from "@preact/signals-core";

export const characterGroup = signal<CharacterGroup>({
  id: "CG1",
  characters: [],
});
