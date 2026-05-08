// Re-export shim. The Editor class lives in @storyteller/ui-pagescene.
// External callers that imported the default Editor export from this
// path keep working unchanged; the construction site (EngineProvider)
// supplies the PageSceneAdapter the lib's Editor now requires.
export { Editor as default } from "@storyteller/ui-pagescene";
export type { EditorInitializeConfig } from "@storyteller/ui-pagescene";
