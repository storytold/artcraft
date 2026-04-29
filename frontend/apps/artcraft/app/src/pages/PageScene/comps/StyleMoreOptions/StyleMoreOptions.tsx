import { useSignals } from "@preact/signals-react/runtime";
import { Modal } from "@storyteller/ui-modal";
import { Button } from "@storyteller/ui-button";
import { StyleOptions } from "~/pages/PageScene/comps/SidePanelTabs/tabComps/StylizeTab/StyleOptions";

interface Props {
  onClose: () => void;
}
export const StyleMoreOptions = ({ onClose }: Props) => {
  useSignals();

  return (
    <Modal isOpen={true} onClose={onClose} title="More Options">
      <StyleOptions />
      <div className="mt-5 flex justify-end">
        <Button onClick={onClose} variant="action">
          Close
        </Button>
      </div>
    </Modal>
  );
};
