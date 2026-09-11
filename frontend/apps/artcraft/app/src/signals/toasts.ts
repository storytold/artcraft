import { v4 as uuidv4 } from "uuid";
import { signal } from "@preact/signals-core";
import { ToastTypes } from "~/enums";
import { FIVE_SECONDS, TEN_SECONDS, TWO_SECONDS } from "~/constants";

export interface Toast {
  id: string;
  type: ToastTypes;
  message: string;
  timestamp: number;
}

export const toasts = signal<Toast[]>([]);

function shouldAddToast(toasts: Toast[], newToast: Toast): boolean {
  //do not pop the same toast if the same toast was popped in the last 2secs
  let noLastToast = true;
  for (let i = toasts.length - 1; i >= 0; i--) {
    if (newToast.timestamp <= toasts[i].timestamp + TWO_SECONDS) {
      break;
    }
    if (
      toasts[i].type === newToast.type &&
      newToast.message === toasts[i].message
    ) {
      noLastToast = false;
      break;
    }
  }
  return noLastToast;
}

export const addToast = (
  type: ToastTypes,
  message: string,
  timeout?: number | false,
) => {
  const newToast: Toast = {
    id: uuidv4(),
    type,
    message,
    timestamp: new Date().getTime(),
  };

  // check if this toast is appropriate to add
  if (!shouldAddToast(toasts.value, newToast)) {
    return;
  }

  // pop the toast
  toasts.value = [...toasts.value, newToast];

  // delete the toast on a timer
  if (timeout === undefined || typeof timeout === "number") {
    const calTimeout = timeout
      ? timeout
      : type === ToastTypes.SUCCESS
        ? TEN_SECONDS
        : FIVE_SECONDS;
    setTimeout(() => {
      //delete toast after timeout
      deleteToast(newToast.id);
    }, calTimeout);
  }
};

export const deleteToast = (id: string) => {
  const filteredToasts = toasts.value.filter((toast) => toast.id !== id);
  if (filteredToasts.length < toasts.value.length) {
    toasts.value = [...filteredToasts];
  }
};
