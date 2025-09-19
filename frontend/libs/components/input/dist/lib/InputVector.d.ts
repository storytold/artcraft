import { DomLevels } from '@storyteller/common';
interface InputVectorProps {
    x: string;
    y: string;
    z: string;
    onChange: (v: Record<string, string>) => void;
    increment?: number;
    disabled?: boolean;
    disableHotkeyInput: (level: DomLevels) => void;
    enableHotkeyInput: (level: DomLevels) => void;
}
export declare const InputVector: ({ x, y, z, onChange, increment, disabled, disableHotkeyInput, enableHotkeyInput, }: InputVectorProps) => import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=InputVector.d.ts.map