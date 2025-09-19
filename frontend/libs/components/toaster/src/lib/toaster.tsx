import toast, { Toaster as RHToaster } from "react-hot-toast";

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
  zIndex = 9,
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
