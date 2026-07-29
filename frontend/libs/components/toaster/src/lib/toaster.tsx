import rhToast, { Toaster as RHToaster } from "react-hot-toast";

// Host apps that render their own toast UI instead of mounting <Toaster />
// (e.g. the webapp) register a delegate here. Shared-lib `toast.success` /
// `toast.error` calls are forwarded to it — without this they dispatch into
// react-hot-toast, which renders nothing when its container isn't mounted.
export interface ToastDelegate {
  success: (message: string) => void;
  error: (message: string) => void;
}

let toastDelegate: ToastDelegate | null = null;

export function setToastDelegate(delegate: ToastDelegate | null) {
  toastDelegate = delegate;
}

const toast: typeof rhToast = Object.assign(
  ((...args: Parameters<typeof rhToast>) => rhToast(...args)) as typeof rhToast,
  rhToast,
  {
    success: ((message, opts) => {
      if (toastDelegate && typeof message === "string") {
        toastDelegate.success(message);
        return "";
      }
      return rhToast.success(message, opts);
    }) as typeof rhToast.success,
    error: ((message, opts) => {
      if (toastDelegate && typeof message === "string") {
        toastDelegate.error(message);
        return "";
      }
      return rhToast.error(message, opts);
    }) as typeof rhToast.error,
  },
);

interface ToasterProps {
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  offsetTop?: number;
  offsetBottom?: number;
  offsetLeft?: number;
  offsetRight?: number;
  zIndex?: number;
}

export function Toaster({
  position = "top-right",
  offsetTop = 12,
  offsetBottom = 12,
  offsetLeft = 12,
  offsetRight = 12,
  zIndex = 15,
}: ToasterProps) {
  return (
    <RHToaster
      position={position}
      toastOptions={{
        success: {
          style: {
            background: "#ffffff",
          },
        },
        error: {
          style: {
            background: "#ffffff",
          },
        },
      }}
      containerStyle={{
        top: offsetTop,
        left: offsetLeft,
        bottom: offsetBottom,
        right: offsetRight,
        zIndex: zIndex,
      }}
      containerClassName="text-[15px] font-medium"
    />
  );
}

export default Toaster;

export { toast };
