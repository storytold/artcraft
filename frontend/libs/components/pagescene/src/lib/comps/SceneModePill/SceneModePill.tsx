import { useShallow } from "zustand/shallow";
import { TabSelector, type TabItem } from "@storyteller/ui-tab-selector";
import { usePageSceneStore, type SceneMode } from "../../PageSceneStore";

const TABS: TabItem[] = [
  { id: "build", label: "Build" },
  { id: "record", label: "Record" },
];

export const SceneModePill = () => {
  const { sceneMode, setSceneMode } = usePageSceneStore(
    useShallow((s) => ({
      sceneMode: s.sceneMode,
      setSceneMode: s.setSceneMode,
    })),
  );

  return (
    <div className="flex justify-center pt-3">
      <TabSelector
        tabs={TABS}
        activeTab={sceneMode}
        onTabChange={(id) => setSceneMode(id as SceneMode)}
        className="w-auto"
        listClassName="rounded-full px-1"
        tabClassName="rounded-full px-5 py-1"
        indicatorClassName="rounded-full bg-white/95"
        selectedTabClassName="text-black"
      />
    </div>
  );
};

export default SceneModePill;
