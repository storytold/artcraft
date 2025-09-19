export interface CheckSoraSessionResult {
    state: SoraSessionState;
    maybe_account_email?: string;
}
export declare enum SoraSessionState {
    NotSetUp = "not_set_up",
    ExpiredOrError = "expired_or_error",
    Valid = "valid"
}
export declare const CheckSoraSession: () => Promise<CheckSoraSessionResult>;
//# sourceMappingURL=CheckSoraSession.d.ts.map