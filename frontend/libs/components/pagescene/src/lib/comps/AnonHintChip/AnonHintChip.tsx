import { useContext } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRightToBracket } from "@fortawesome/pro-solid-svg-icons";
import { EngineContext } from "../../contexts/EngineContext/EngineContext";
import { usePageSceneStore, useIsViewOnly } from "../../PageSceneStore";

// Quiet "you're signed out" affordance shown in the editor playground for
// anonymous visitors. Hidden in view-only mode (the visitor is consuming
// someone else's scene; no upsell pressure needed). The actual per-action
// signup CTAs (Save, Generate, Upload) still fire when the user clicks
// those buttons — this chip just sets expectations up front.
export const AnonHintChip = () => {
  const editor = useContext(EngineContext);
  const currentUserToken = usePageSceneStore((s) => s.currentUserToken);
  const isViewOnly = useIsViewOnly();

  if (currentUserToken || isViewOnly) return null;

  const handleClick = () => {
    editor?.adapter.promptSignup?.("hint");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="glass flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-white/80 shadow-md transition-colors hover:bg-ui-controls/100 hover:text-white"
    >
      <FontAwesomeIcon icon={faArrowRightToBracket} className="opacity-70" />
      Sign up to save
    </button>
  );
};
