import { ChangeEvent, useContext, useEffect } from "react";
import { Textarea } from "~/components";
import { EngineContext } from "~/pages/PageScene/contexts/EngineContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronUp,
  faRandom,
} from "@fortawesome/pro-solid-svg-icons";
import { RandomTextsPositive } from "~/pages/PageScene/constants/RandomTexts";
import { useShallow } from "zustand/shallow";
import { useSignals } from "@preact/signals-react/runtime";
import { Transition } from "@headlessui/react";
import { currentPage } from "~/signals";
import { Pages } from "~/pages/PageScene/constants/page";
import { usePageSceneStore } from "~/pages/PageScene/PageSceneStore";

export const Prompts = () => {
  useSignals();
  const editorEngine = useContext(EngineContext);
  const {
    selectedArtStyle,
    positivePrompt,
    negativePrompt,
    isUserInputPositive,
    showNegativePrompt,
    setPositivePrompt,
    setNegativePrompt,
    setIsUserInputPositive,
    setIsUserInputNegative,
    setShowNegativePrompt,
  } = usePageSceneStore(
    useShallow((s) => ({
      selectedArtStyle: s.selectedArtStyle,
      positivePrompt: s.positivePrompt,
      negativePrompt: s.negativePrompt,
      isUserInputPositive: s.isUserInputPositive,
      showNegativePrompt: s.showNegativePrompt,
      setPositivePrompt: s.setPositivePrompt,
      setNegativePrompt: s.setNegativePrompt,
      setIsUserInputPositive: s.setIsUserInputPositive,
      setIsUserInputNegative: s.setIsUserInputNegative,
      setShowNegativePrompt: s.setShowNegativePrompt,
    })),
  );

  useEffect(() => {
    if (editorEngine === null) return;
    if (!isUserInputPositive) {
      const randomIndex = Math.floor(
        Math.random() * RandomTextsPositive[selectedArtStyle].length,
      );
      const randomText = RandomTextsPositive[selectedArtStyle][randomIndex];
      editorEngine.positive_prompt = randomText;
      setPositivePrompt(randomText);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorEngine]);

  const onChangeHandlerNegative = (event: ChangeEvent<HTMLTextAreaElement>) => {
    if (editorEngine === null) return;
    setIsUserInputNegative(true);
    editorEngine.negative_prompt = event.target.value;
    setNegativePrompt(event.target.value);
  };

  const onChangeHandlerPositive = (event: ChangeEvent<HTMLTextAreaElement>) => {
    if (editorEngine === null) return;
    setIsUserInputPositive(true);
    editorEngine.positive_prompt = event.target.value;
    setPositivePrompt(event.target.value);
  };

  const generateRandomTextPositive = () => {
    const randomIndex = Math.floor(
      Math.random() * RandomTextsPositive[selectedArtStyle].length,
    );
    const randomText = RandomTextsPositive[selectedArtStyle][randomIndex];
    if (editorEngine === null) return;
    setIsUserInputPositive(false);
    editorEngine.positive_prompt = randomText;
    setPositivePrompt(randomText);
  };

  return (
    <div className="flex flex-col gap-3 rounded-t-lg bg-ui-panel">
      <div className="relative w-full">
        <Textarea
          label="Enter a Prompt"
          className="w-full text-sm"
          rows={3}
          name="positive-prompt"
          placeholder="Type here to describe your scene"
          onChange={onChangeHandlerPositive}
          required
          value={positivePrompt}
          resize="none"
        />
        <div className="absolute right-0 top-[2px]">
          <button
            className="flex items-center text-xs font-medium text-brand-primary transition-colors duration-100 hover:text-brand-primary-400"
            onClick={generateRandomTextPositive}
          >
            <FontAwesomeIcon icon={faRandom} className="me-1.5" />
            Randomize
          </button>
        </div>
      </div>
      {currentPage.value === Pages.EDIT ? (
        <>
          <Transition
            show={showNegativePrompt}
            enter="transition-all duration-200 ease-in-out"
            enterFrom="opacity-0 max-h-0"
            enterTo="opacity-100 max-h-36"
            leave="transition-all duration-200 ease-in-out"
            leaveFrom="opacity-100 max-h-36"
            leaveTo="opacity-0 max-h-0"
          >
            <div className="relative w-full">
              <Textarea
                label="Negative Prompt"
                className="w-full text-sm"
                rows={2}
                name="negative-prompt"
                placeholder="Type here to filter out the things you don't want in the scene"
                onChange={onChangeHandlerNegative}
                value={negativePrompt}
                resize="none"
              />
            </div>
          </Transition>
          <div>
            <button
              className="flex items-center text-xs font-medium text-brand-primary transition-colors duration-100 hover:text-brand-primary-400"
              onClick={() => setShowNegativePrompt(!showNegativePrompt)}
            >
              {showNegativePrompt ? "Hide" : "Show"} Negative Prompt
              <FontAwesomeIcon
                icon={showNegativePrompt ? faChevronUp : faChevronDown}
                className="ms-1.5"
              />
            </button>
          </div>
        </>
      ) : (
        <div className="relative w-full">
          <Textarea
            label="Negative Prompt"
            className="w-full text-sm"
            rows={2}
            name="negative-prompt"
            placeholder="Type here to filter out the things you don't want in the scene"
            onChange={onChangeHandlerNegative}
            value={negativePrompt}
            resize="none"
          />
        </div>
      )}
    </div>
  );
};
