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
        listClassName="rounded-none border border-ui-panel-border bg-ui-controls px-1"
        tabClassName="rounded-[3px] px-5 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-300"
        indicatorClassName="rounded-[3px] bg-white/95"
        selectedTabClassName="text-black"
      />
    </div>
  );
};

export default SceneModePill;
