import { PreviewCanvas } from "./PreviewCanvas";
import { PreviewToolbar } from "./PreviewToolbar";

export function PreviewPanel() {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden border-x border-ui-panel-border bg-ui-background">
      <PreviewCanvas />
      <PreviewToolbar />
    </div>
  );
}
