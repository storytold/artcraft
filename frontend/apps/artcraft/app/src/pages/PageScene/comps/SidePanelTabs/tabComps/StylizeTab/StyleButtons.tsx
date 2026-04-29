import { Label } from "~/components";
import { Button } from "@storyteller/ui-button";
import {
  faArrowsRotate,
  faChevronLeft,
} from "@fortawesome/pro-solid-svg-icons";
import { useShallow } from "zustand/shallow";
import { EditorStates } from "~/pages/PageScene/enums";
import { usePageSceneStore } from "~/pages/PageScene/PageSceneStore";
import { StyleStrength } from "~/pages/PageScene/comps/SidePanelTabs/tabComps/StylizeTab/StyleStrength";
import { StyleOptions } from "~/pages/PageScene/comps/SidePanelTabs/tabComps/StylizeTab/StyleOptions";

export function StyleButtons() {
  const { editorState, previewSrc, setEditorState } = usePageSceneStore(
    useShallow((s) => ({
      editorState: s.editorState,
      previewSrc: s.previewSrc,
      setEditorState: s.setEditorState,
    })),
  );

  const switchPreview = async () => {
    setEditorState(EditorStates.PREVIEW);
  };

  const switchEdit = async () => {
    setEditorState(EditorStates.EDIT);
  };

  const refreshPreview = async () => {
    // TODO: wire to editor.refreshPreview() once editor.ts is migrated.
  };

  return (
    <div className="flex w-full flex-col justify-center gap-4 rounded-b-lg bg-ui-panel">
      <div className="flex w-full flex-col gap-3">
        <div className="w-full">
          <Label>Render the camera view with AI</Label>
          <div className="mb-2 text-xs text-white/70">
            (This helps you test and re-test your scene)
          </div>
          {editorState !== EditorStates.PREVIEW && (
            <Button
              icon={faArrowsRotate}
              variant="action"
              className="mt-1.5 w-full"
              onClick={switchPreview}
            >
              Preview Frame
            </Button>
          )}
          {editorState === EditorStates.PREVIEW && (
            <div className="flex gap-2">
              <Button
                icon={faChevronLeft}
                variant="action"
                onClick={switchEdit}
              >
                Back
              </Button>
              <Button
                icon={faArrowsRotate}
                variant="primary"
                onClick={refreshPreview}
                className="grow"
                loading={previewSrc === ""}
              >
                {previewSrc === "" ? "Rendering..." : "Re-render Preview"}
              </Button>
            </div>
          )}
        </div>
        <StyleOptions />
        <StyleStrength />
      </div>
    </div>
  );
}
