import { default as toast } from 'react-hot-toast';
interface ToasterProps {
    position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
    offsetTop?: number;
    offsetBottom?: number;
    offsetLeft?: number;
    offsetRight?: number;
    zIndex?: number;
}
export declare function Toaster({ position, offsetTop, offsetBottom, offsetLeft, offsetRight, zIndex, }: ToasterProps): import("react/jsx-runtime").JSX.Element;
export default Toaster;
export { toast };
//# sourceMappingURL=toaster.d.ts.map