import { PopoverMenu, type PopoverItem } from "@storyteller/ui-popover";
import { useClassyModelSelectorStore } from "./classy-model-selector-store";
import { useEffect, useMemo } from "react";
import { ModelPage } from "./model-pages";

interface ClassyModelSelectorProps {
  items: Omit<PopoverItem, "selected">[];
  page: ModelPage;
  mode?: "hoverSelect" | "default" | "toggle" | "button";
  panelTitle?: string;
  buttonClassName?: string;
  panelClassName?: string;
  showIconsInList?: boolean;
  triggerLabel?: string;
}

export function ClassyModelSelector({
  items,
  page,
  ...popoverProps
}: ClassyModelSelectorProps) {
  const { selectedModels, setSelectedModel } = useClassyModelSelectorStore();
  const selectedModel = selectedModels[page] || items[0]?.model;

  // For the first mount, make sure the selected model is set for other components to listen
  useEffect(() => {
    // Initialize selected model if not set
    if (!selectedModels[page] && items[0]) {
      setSelectedModel(page, items[0].model!);
    }
  }, []);

  const handleModelSelect = (item: PopoverItem) => {
    console.log(`Model selector changed on page "${page}": `, item.model);
    setSelectedModel(page, item.model!);
  };

  const modelList = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        selected: item.model === selectedModel,
      })),
    [items, selectedModel]
  );

  return (
    <PopoverMenu
      items={modelList}
      onSelect={handleModelSelect}
      mode="hoverSelect"
      {...popoverProps}
      buttonClassName="border-0 bg-transparent p-0 hover:bg-transparent text-lg hover:opacity-80 shadow-none"
    />
  );
}

export default ClassyModelSelector;
