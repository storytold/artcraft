import { Modal } from "@storyteller/ui-modal";
import { Button } from "@storyteller/ui-button";
import { StyleOptions } from "./StyleOptions";

interface Props {
  onClose: () => void;
}
export const StyleMoreOptions = ({ onClose }: Props) => {

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
