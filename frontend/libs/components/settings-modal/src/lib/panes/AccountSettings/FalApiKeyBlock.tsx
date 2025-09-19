import { useState, useEffect } from "react";
import { GetFalApiKey, SetFalApiKey } from "@storyteller/tauri-api";
import { Input } from "@storyteller/ui-input";


export const FalApiKeyBlock = () => {
  const [falApiKey, setFalApiKey] = useState<string | undefined>(
    undefined
  );
  const [isCheckingFalApiKey, setIsCheckingFalApiKey] =
    useState(false);

  useEffect(() => {
    const fetchKey = async () => {
      setIsCheckingFalApiKey(true);
      try {
        const result = await GetFalApiKey();
        if ("payload" in result) {
          setFalApiKey(result.payload.key);
        }
      } catch (e) {
        console.error("Error fetching Fal API key", e);
        setFalApiKey(undefined);
      } finally {
        setIsCheckingFalApiKey(false);
      }
    };
    fetchKey();
  }, []);

  const syncFalApiKey = async (key: string) => {
    await SetFalApiKey(key);
    setFalApiKey(key);
  };

  return (
    <div className="flex justify-between items-center">
      <span>Fal API Key:</span>
      <Input
        value={falApiKey}
        onChange={(e) => syncFalApiKey(e.target.value)}
        placeholder="Enter Fal API key"
      />
      {/*<Button
        variant={
          isCheckingArtcraftSession
            ? "secondary"
            : isLoggedIn
            ? "destructive"
            : "primary"
        }
        className="h-[30px]"
        onClick={handleArtcraftButton}
        disabled={isCheckingArtcraftSession}
      >
        {isCheckingArtcraftSession ? (
          <FontAwesomeIcon
            icon={faSpinnerThird}
            className="animate-spin text-sm"
          />
        ) : isLoggedIn ? (
          "Log Out"
        ) : (
          "Log In"
        )}
      </Button>*/}
    </div>
  );
};
