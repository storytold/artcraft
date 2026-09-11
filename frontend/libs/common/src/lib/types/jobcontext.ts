
export interface JobContextType {
  jobTokens: string[];
  addJobToken: (token: string) => void;
  removeJobToken: (token: string) => void;
  clearJobTokens: () => void;
}