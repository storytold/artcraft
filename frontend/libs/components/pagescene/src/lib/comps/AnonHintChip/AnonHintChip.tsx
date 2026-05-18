import { useContext } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRightToBracket } from "@fortawesome/pro-solid-svg-icons";
import { EngineContext } from "../../contexts/EngineContext/EngineContext";
import { usePageSceneStore } from "../../PageSceneStore";

// Quiet "you're signed out" affordance shown in the editor for anonymous
// visitors — playground or someone else's scene alike. The actual
// per-action signup CTAs (Save, Generate, Upload) still fire when the
// user clicks those buttons; this chip just sets expectations up front.
export const AnonHintChip = () => {
  const editor = useContext(EngineContext);
  const currentUserToken = usePageSceneStore((s) => s.currentUserToken);

  if (currentUserToken) return null;

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
