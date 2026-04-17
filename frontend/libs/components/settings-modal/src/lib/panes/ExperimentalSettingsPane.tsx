import { Label } from "@storyteller/ui-label";

export const ExperimentalSettingsPane = () => {
  return (
    <div className="space-y-4 text-base-fg">
      <div className="space-y-1">
        <Label>Experimental Features</Label>
        <p className="opacity-80">
          This section is reserved for in-development features. There are no
          experimental options available right now.
        </p>
      </div>
    </div>
  );
};
