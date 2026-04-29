import { MediaItem } from "~/pages/PageEnigma/models";
import { characterGroup } from "~/pages/PageEnigma/signals";

export function deleteCharacter(item: MediaItem) {
  characterGroup.value = {
    ...characterGroup.value,
    characters: characterGroup.value.characters.filter(
      (character) => character.object_uuid !== item.object_uuid,
    ),
  };
}
