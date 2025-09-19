interface LoginModalStore {
    isOpen: boolean;
    recheckTrigger: number;
    openModal: () => void;
    closeModal: () => void;
    triggerRecheck: () => void;
}
export declare const useLoginModalStore: import('zustand').UseBoundStore<import('zustand').StoreApi<LoginModalStore>>;
export {};
//# sourceMappingURL=useLoginModalStore.d.ts.map