import { UploaderStates } from "~/enums";

export interface UploaderState {
  status: UploaderStates;
  errorMessage?: string;
  data?: string;
  uploadProgress?: { current: number; total: number };
}

export const initialUploaderState = {
  status: UploaderStates.ready,
};
