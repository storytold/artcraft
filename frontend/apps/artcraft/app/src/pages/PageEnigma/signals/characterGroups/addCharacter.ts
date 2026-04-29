import { CharacterTrack, MediaItem } from "~/pages/PageEnigma/models";
import { characterGroup } from "~/pages/PageEnigma/signals";
import { usePageEnigmaStore } from "~/pages/PageEnigma/PageEnigmaStore";

export function addCharacter(character: MediaItem) {
  // TODO: After editor.ts is migrated, replace with actions/addCharacter which
  // calls editor.addCharacter(character) and updates the store in one step.
  usePageEnigmaStore.getState().addCharacter({
    id: character.object_uuid ?? character.media_id,
    kind: "character",
    name: character.name ?? "character",
    mediaId: character.media_id,
  });
  addNewCharacter(character);
}

export function addNewCharacter(data: MediaItem) {
  const newCharacterGroups = {
    ...characterGroup.value,
    characters: [...characterGroup.value.characters],
  };

  const newCharacter = {
    object_uuid: data.object_uuid,
    name: data.name,
    media_id: data.media_id,
    mediaType: data.media_type,
    animationType: data.maybe_animation_type,
    muted: false,
    minimized: false,
    animationClips: [],
    positionKeyframes: [],
    expressionClips: [],
    lipSyncClips: [],
  } as CharacterTrack;

  newCharacterGroups.characters.push(newCharacter);
  newCharacterGroups.characters.sort((charA, charB) =>
    charA.object_uuid < charB.object_uuid ? -1 : 1,
  );

  characterGroup.value = newCharacterGroups;
}
