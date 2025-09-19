import { CommandResult } from '../common/CommandStatus';
export interface GetOpenAIApiKeySuccessResult extends CommandResult {
    payload: {
        key: string;
    };
}
export type GetOpenAIApiKeyResult = GetOpenAIApiKeySuccessResult | CommandResult;
export declare const GetOpenAIApiKey: () => Promise<GetOpenAIApiKeyResult>;
//# sourceMappingURL=GetOpenAIApiKey.d.ts.map