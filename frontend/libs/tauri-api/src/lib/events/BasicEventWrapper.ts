
export enum BasicEventStatus {
  Success = "success",
  Failure = "failure",
};

export interface BasicEventWrapper<T> {
  status: BasicEventStatus,
  data: T,
};
