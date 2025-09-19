import { useState, useEffect } from "react";
import { GetOpenAIApiKey, SetOpenAIApiKey } from "@storyteller/tauri-api";
import { Input } from "@storyteller/ui-input";


export const OpenAIApiKeyBlock = () => {
  const [openAIApiKey, setOpenAIApiKey] = useState<string | undefined>(
    undefined
  );

  const [isCheckingOpenAIApiKey, setIsCheckingOpenAIApiKey] =
    useState(false);

  useEffect(() => {
    const fetchKey = async () => {
      setIsCheckingOpenAIApiKey(true);
      try {
        const result = await GetOpenAIApiKey();
        if ("payload" in result) {
          setOpenAIApiKey(result.payload.key);
        }
      } catch (e) {
        console.error("Error fetching Fal API key", e);
        setOpenAIApiKey(undefined);
      } finally {
        setIsCheckingOpenAIApiKey(false);
      }
    };
    fetchKey();
  }, []);

  const syncOpenAIApiKey = async (key: string) => {
    await SetOpenAIApiKey(key);
    setOpenAIApiKey(key);
  };

  return (
    <div className="flex justify-between items-center">
      <span>Open AI API Key:</span>
      <Input
        value={openAIApiKey}
        onChange={(e) => syncOpenAIApiKey(e.target.value)}
        placeholder="Enter Open AI API key"
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
