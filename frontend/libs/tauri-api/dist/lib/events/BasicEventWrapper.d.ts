export declare enum BasicEventStatus {
    Success = "success",
    Failure = "failure"
}
export interface BasicEventWrapper<T> {
    status: BasicEventStatus;
    data: T;
}
//# sourceMappingURL=BasicEventWrapper.d.ts.map