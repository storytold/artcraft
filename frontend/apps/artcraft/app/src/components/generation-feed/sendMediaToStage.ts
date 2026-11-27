import { addObject, AssetType, getActiveEditor } from "@storyteller/ui-pagescene";
import { useTabStore } from "../../pages/Stores/TabState";

/** Add a library asset only after the stage and its saved scene are ready. */
export async function sendMediaToStage(mediaId?: string, name = "3D asset"): Promise<void> {
  if (!mediaId) throw new Error("This asset has no media ID. Please reopen it from your library.");
  if (!await useTabStore.getState().setActiveTab("3D")) {
    throw new Error("Could not open the 3D stage.");
  }
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (useTabStore.getState().activeTabId !== "3D") {
      throw new Error("Stage transfer cancelled because you switched tabs.");
    }
    const editor = getActiveEditor();
    if (editor?.sceneManager && editor.isEngineDataLoaded()) {
      const objectId = await addObject(editor, { version: 1, type: AssetType.OBJECT, media_id: mediaId, name });
      if (!objectId) throw new Error("The asset could not be added to the stage. Please try again.");
      if (getActiveEditor() !== editor) throw new Error("The stage changed while the asset was loading. Please try again.");
      return;
    }
    await new Promise<void>((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("The 3D stage is still loading. Please try again in a moment.");
}
