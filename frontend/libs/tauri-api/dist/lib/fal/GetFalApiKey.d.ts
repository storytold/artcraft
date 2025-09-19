import { CommandResult } from '../common/CommandStatus';
export interface GetFalApiKeySuccessResult extends CommandResult {
    payload: {
        key: string;
    };
}
export type GetFalApiKeyResult = GetFalApiKeySuccessResult | CommandResult;
export declare const GetFalApiKey: () => Promise<GetFalApiKeyResult>;
//# sourceMappingURL=GetFalApiKey.d.ts.map