import { Fragment, useCallback } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { DoNotShow } from "~/constants";
import { Button } from "@storyteller/ui-button"
import { Checkbox } from "@storyteller/ui-checkbox";

interface Props {
  text: string;
  title: string;
  open: boolean;
  onClose: () => void;
  onOk?: () => void;
  okText?: string;
  okColor?: string;
  onCancel?: () => void;
  cancelText?: string;
  canHide?: boolean;
}

export const ConfirmationModal = ({
  text,
  title,
  open,
  onClose,
  onOk,
  okText = "OK",
  okColor = "bg-brand-success",
  onCancel,
  cancelText = "Cancel",
  canHide,
}: Props) => {
  const handleOk = useCallback(() => {
    const element = document.getElementById("hide-dialog");
    if (element) {
      if ((element as HTMLInputElement).checked) {
        localStorage.setItem(title.replace(" ", "-"), DoNotShow);
      }
    }

    onOk!();
  }, [onOk, title]);

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog open={open} onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>
        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-xl border border-ui-panel-border bg-ui-panel p-5 text-left align-middle shadow-xl transition-all">
              <Dialog.Title
                as="h4"
                className="mb-4 text-xl font-bold text-white"
              >
                {title}
              </Dialog.Title>

              <div className="mt-2">{text}</div>
              {canHide && (
                <div className="mt-2">
                  <Checkbox id="hide-dialog" label="Do not show this again" />
                </div>
              )}

              <div className="mt-6 flex justify-end gap-2">
                {!!onCancel && (
                  <Button
                    type="button"
                    onClick={onCancel}
                    className="rounded-lg px-3 py-2"
                    variant="secondary"
                  >
                    {cancelText}
                  </Button>
                )}
                {!!onOk && (
                  <Button
                    type="button"
                    onClick={handleOk}
                    className={[okColor, "rounded-lg px-3 py-2"].join(" ")}
                  >
                    {okText}
                  </Button>
                )}
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};