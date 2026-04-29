//TODO: DELETE

import { useContext } from "react";
import { Button } from "@storyteller/ui-button" 
import { EngineContext } from "~/pages/PageScene/contexts/EngineContext";

export const TestFeaturesButtons = ({ debug }: { debug: boolean }) => {
  if (!debug) return null;

  const editorEngine = useContext(EngineContext);

  const handleButtonCameraView = () => {
    editorEngine?.switchCameraView();
  };
  const testStylizeRequest = () => {
    // editorEngine?.testStylizeRequest();
    //console.log("editorEnging does not have testStylizeRequest");
  };
  const handleButtonRender = () => {
    editorEngine?.generateVideo();
  };

  const handleButtonTakeFrame = () => {
    // editorEngine?.take_timeline_cam_clip();
    //console.log("editorEnging does not have take_timeline_cam_clip");
  };

  const handleButtonSingleFrame = () => {
    editorEngine?.generateFrame();
  };

  const handleButtonPlayBack = () => {
    editorEngine?.togglePlayback();
  };

  const smallButtons = "text-xs p-2 h-6 ";
  const tertiaryColor =
    "bg-brand-tertiary hover:bg-brand-teriary-400 focus-visible:outline-brand-tertiary ";

  return (
    <>
      <div className="flex gap-1">
        <Button
          variant="secondary"
          onClick={handleButtonCameraView}
          className={smallButtons}
        >
          Toggle Camera View
        </Button>
      </div>
      <div className="flex gap-1">
        <Button onClick={handleButtonSingleFrame} className={smallButtons}>
          Render Single Frame
        </Button>
        <Button onClick={handleButtonTakeFrame} className={smallButtons}>
          Take Frame
        </Button>
        <Button onClick={handleButtonRender} className={smallButtons}>
          Render
        </Button>
        <Button
          onClick={testStylizeRequest}
          className={
            "hover:bg-brand-teriary-400 bg-brand-tertiary focus-visible:outline-brand-tertiary " +
            smallButtons
          }
          style={{ zIndex: 9001 }}
        >
          Test Stylize
        </Button>
      </div>
    </>
  );
};
