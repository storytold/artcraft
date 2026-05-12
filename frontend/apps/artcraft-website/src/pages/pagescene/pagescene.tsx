import { useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Stage3D,
  usePageSceneStore,
} from "@storyteller/ui-pagescene";
import { useSession } from "../../lib/session";
import { useWebPageSceneAdapter } from "./web-adapter";

export default function PageScene() {
  const { sceneToken } = useParams<{ sceneToken?: string }>();
  const { user } = useSession();
  const navigate = useNavigate();

  // Mirror the current user token into the lib's store so ownership-based
  // gating (read-only mode, save button visibility) reacts to auth changes.
  // Anonymous viewers get undefined here, which the lib already handles.
  useEffect(() => {
    usePageSceneStore.getState().setCurrentUserToken(user?.user_token);
  }, [user?.user_token]);

  const navigateToImageTo3D = useCallback(() => {
    navigate("/create-image");
  }, [navigate]);

  const adapter = useWebPageSceneAdapter({
    userToken: user?.user_token,
    initialSceneToken: sceneToken,
    navigateToImageTo3D,
  });

  return (
    <Stage3D
      adapter={adapter}
      sceneToken={sceneToken}
    />
  );
}
