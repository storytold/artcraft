import { default as React } from 'react';
interface ArtCraftSignUpProps {
    onSubmit: (username: string, email: string, password: string, passwordConfirmation: string) => void;
    isSignUp: boolean;
    onToggleMode: () => void;
    formRef?: React.RefObject<HTMLFormElement | null>;
    errorMessage?: string;
}
export declare const ArtCraftSignUp: ({ onSubmit, isSignUp, onToggleMode, formRef, errorMessage, }: ArtCraftSignUpProps) => import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=artcraft-signup.d.ts.map